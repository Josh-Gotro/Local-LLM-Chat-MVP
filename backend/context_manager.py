"""
Enhanced Context Management System
Implements comprehensive context management patterns for LLM conversations
"""

import json
import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import re
import logging

logger = logging.getLogger(__name__)

@dataclass
class Message:
    role: str
    content: str
    timestamp: float = None
    message_id: str = None
    tokens: int = 0
    salience_score: float = 1.0
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.message_id is None:
            self.message_id = hashlib.md5(f"{self.role}:{self.content}:{self.timestamp}".encode()).hexdigest()[:8]
        if self.tokens == 0:
            self.tokens = self.estimate_tokens()
    
    def estimate_tokens(self) -> int:
        """Rough token estimation: 1 token ≈ 4 characters"""
        return max(1, len(self.content) // 4)

@dataclass
class ContextChunk:
    """A chunk of conversation context for RAG retrieval"""
    content: str
    message_ids: List[str]
    chunk_type: str  # 'decision', 'constraint', 'fact', 'exchange'
    timestamp: float
    tokens: int
    embedding_key: str = None
    
    def __post_init__(self):
        if self.embedding_key is None:
            self.embedding_key = hashlib.md5(self.content.encode()).hexdigest()

@dataclass
class SessionMemory:
    """Multi-layered session memory structure"""
    
    # Profile Memory (persistent across sessions)
    profile: Dict[str, Any] = None
    
    # Project Memory (stable mid-term context)
    constraints_decisions: List[str] = None
    canonical_facts: Dict[str, str] = None
    entities: Dict[str, str] = None
    
    # Scratchpad (ephemeral short-term)
    current_topic: str = ""
    working_context: str = ""
    
    # Rolling Summary (living document)
    rolling_summary: str = ""
    summary_version: int = 0
    
    def __post_init__(self):
        if self.profile is None:
            self.profile = {}
        if self.constraints_decisions is None:
            self.constraints_decisions = []
        if self.canonical_facts is None:
            self.canonical_facts = {}
        if self.entities is None:
            self.entities = {}

class ContextManager:
    """
    Enhanced context management with multiple strategies:
    1. Budget-based token management
    2. Semantic sliding window
    3. Hierarchical summarization
    4. RAG-style retrieval
    5. Constraint/decision tracking
    """
    
    def __init__(self, 
                 max_tokens: int = 32000,  # Much larger default for modern LLMs
                 reply_reserve_ratio: float = 0.25,  # Reduced reserve ratio
                 recent_window_size: int = 8):  # More recent messages
        self.max_tokens = max_tokens
        self.reply_reserve_ratio = reply_reserve_ratio
        self.recent_window_size = recent_window_size
        self.available_tokens = int(max_tokens * (1 - reply_reserve_ratio))
        
        # Conversation storage
        self.messages: List[Message] = []
        self.context_chunks: List[ContextChunk] = []
        self.session_memory = SessionMemory()
        
        # Context management state
        self.last_condensation = 0
        self.condensation_count = 0
        
    def add_message(self, role: str, content: str, salience_score: float = 1.0) -> Message:
        """Add a new message to the conversation"""
        message = Message(role=role, content=content, salience_score=salience_score)
        self.messages.append(message)
        
        # Update salience scores based on recency and interaction patterns
        self._update_salience_scores()
        
        return message
    
    def _update_salience_scores(self):
        """Update salience scores using time decay and interaction patterns"""
        current_time = time.time()
        for i, msg in enumerate(self.messages):
            # Time decay factor
            age_hours = (current_time - msg.timestamp) / 3600
            time_decay = max(0.1, 1.0 - (age_hours / 24))  # Decay over 24 hours
            
            # Position bias (recent messages more salient)
            position_bias = (i + 1) / len(self.messages)
            
            # Update salience score
            msg.salience_score = min(2.0, msg.salience_score * time_decay * position_bias)
    
    def estimate_context_tokens(self, include_memory: bool = True) -> Dict[str, int]:
        """Calculate token usage across different context components"""
        breakdown = {
            'system': 0,
            'constraints_decisions': 0,
            'rolling_summary': 0,
            'recent_messages': 0,
            'retrieved_chunks': 0,
            'scratchpad': 0,
            'total': 0
        }
        
        if include_memory:
            # System prompt and constraints
            constraints_text = "\n".join(self.session_memory.constraints_decisions)
            breakdown['constraints_decisions'] = len(constraints_text) // 4
            
            # Rolling summary
            breakdown['rolling_summary'] = len(self.session_memory.rolling_summary) // 4
            
            # Scratchpad
            scratchpad_text = f"{self.session_memory.current_topic} {self.session_memory.working_context}"
            breakdown['scratchpad'] = len(scratchpad_text) // 4
        
        # Recent messages
        recent_messages = self.messages[-self.recent_window_size:]
        breakdown['recent_messages'] = sum(msg.tokens for msg in recent_messages)
        
        # Calculate total
        breakdown['total'] = sum(breakdown.values())
        
        return breakdown
    
    def needs_condensation(self) -> bool:
        """Determine if context needs condensation"""
        token_breakdown = self.estimate_context_tokens()
        
        # Check if we're approaching token limit
        usage_ratio = token_breakdown['total'] / self.available_tokens
        
        # Trigger condensation at 90% capacity or if we have too many messages
        return (usage_ratio >= 0.90 or 
                len(self.messages) > 50 or  # Allow many more messages before condensing
                token_breakdown['recent_messages'] > self.available_tokens * 0.7)
    
    def create_context_chunks(self, messages: List[Message]) -> List[ContextChunk]:
        """Convert messages into context chunks for RAG indexing"""
        chunks = []
        
        # Group messages into semantic chunks
        i = 0
        while i < len(messages):
            chunk_messages = [messages[i]]
            chunk_content = f"{messages[i].role}: {messages[i].content}"
            
            # Look ahead for related messages (same topic/entity continuation)
            j = i + 1
            while j < len(messages) and j < i + 3:  # Max 3 messages per chunk
                next_msg = messages[j]
                
                # Check if messages are related (simple heuristic)
                if (self._messages_related(messages[i], next_msg) and 
                    len(chunk_content) < 400):  # Keep chunks manageable
                    chunk_messages.append(next_msg)
                    chunk_content += f"\n{next_msg.role}: {next_msg.content}"
                    j += 1
                else:
                    break
            
            # Determine chunk type
            chunk_type = self._classify_chunk_type(chunk_content)
            
            chunk = ContextChunk(
                content=chunk_content,
                message_ids=[msg.message_id for msg in chunk_messages],
                chunk_type=chunk_type,
                timestamp=chunk_messages[0].timestamp,
                tokens=sum(msg.tokens for msg in chunk_messages)
            )
            
            chunks.append(chunk)
            i = j
        
        return chunks
    
    def _messages_related(self, msg1: Message, msg2: Message) -> bool:
        """Simple heuristic to determine if messages are related"""
        # Time proximity (within 5 minutes)
        time_diff = abs(msg1.timestamp - msg2.timestamp)
        if time_diff > 300:  # 5 minutes
            return False
        
        # Role alternation (user -> assistant -> user)
        if msg1.role == msg2.role:
            return False
        
        # Content similarity (shared entities/keywords)
        words1 = set(re.findall(r'\w+', msg1.content.lower()))
        words2 = set(re.findall(r'\w+', msg2.content.lower()))
        overlap = len(words1.intersection(words2))
        min_length = min(len(words1), len(words2))
        
        return overlap / max(min_length, 1) > 0.2
    
    def _classify_chunk_type(self, content: str) -> str:
        """Classify chunk type for better organization"""
        content_lower = content.lower()
        
        # Decision patterns
        if any(phrase in content_lower for phrase in [
            'decision:', 'decided', 'let\'s use', 'we\'ll go with', 'agreed'
        ]):
            return 'decision'
        
        # Constraint patterns
        if any(phrase in content_lower for phrase in [
            'constraint:', 'must', 'should not', 'requirement', 'rule'
        ]):
            return 'constraint'
        
        # Fact patterns
        if any(phrase in content_lower for phrase in [
            'fact:', 'is defined as', 'equals', 'specification'
        ]):
            return 'fact'
        
        return 'exchange'
    
    def semantic_retrieval(self, query: str, max_chunks: int = 3) -> List[ContextChunk]:
        """Retrieve relevant context chunks based on semantic similarity"""
        if not self.context_chunks:
            return []
        
        # Simple keyword-based similarity (in production, use vector embeddings)
        query_words = set(re.findall(r'\w+', query.lower()))
        
        scored_chunks = []
        for chunk in self.context_chunks:
            chunk_words = set(re.findall(r'\w+', chunk.content.lower()))
            
            # Calculate similarity score
            overlap = len(query_words.intersection(chunk_words))
            union = len(query_words.union(chunk_words))
            jaccard_similarity = overlap / max(union, 1)
            
            # Boost important chunk types
            type_boost = {
                'decision': 1.5,
                'constraint': 1.4,
                'fact': 1.3,
                'exchange': 1.0
            }.get(chunk.chunk_type, 1.0)
            
            # Time decay (prefer newer chunks slightly)
            age_hours = (time.time() - chunk.timestamp) / 3600
            time_factor = max(0.5, 1.0 - (age_hours / 48))  # Decay over 48 hours
            
            final_score = jaccard_similarity * type_boost * time_factor
            
            if final_score > 0.1:  # Minimum relevance threshold
                scored_chunks.append((chunk, final_score))
        
        # Sort by score and return top chunks
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return [chunk for chunk, score in scored_chunks[:max_chunks]]
    
    async def condense_context(self, llm_function) -> Dict[str, Any]:
        """
        Perform intelligent context condensation using multiple strategies
        """
        if not self.needs_condensation():
            return {'action': 'no_condensation_needed', 'token_savings': 0}
        
        original_tokens = self.estimate_context_tokens()['total']
        
        # Strategy 1: Create/update rolling summary
        messages_to_summarize = self.messages[:-self.recent_window_size]
        if messages_to_summarize:
            new_summary = await self._create_rolling_summary(messages_to_summarize, llm_function)
            self.session_memory.rolling_summary = new_summary
            self.session_memory.summary_version += 1
        
        # Strategy 2: Extract constraints and decisions
        await self._extract_constraints_decisions(messages_to_summarize, llm_function)
        
        # Strategy 3: Create context chunks for RAG
        new_chunks = self.create_context_chunks(messages_to_summarize)
        self.context_chunks.extend(new_chunks)
        
        # Strategy 4: Trim to recent messages only
        kept_messages = self.messages[-self.recent_window_size:]
        self.messages = kept_messages
        
        # Strategy 5: Clean up old chunks (keep only last 20)
        if len(self.context_chunks) > 20:
            self.context_chunks = sorted(
                self.context_chunks, 
                key=lambda x: x.timestamp, 
                reverse=True
            )[:20]
        
        new_tokens = self.estimate_context_tokens()['total']
        token_savings = original_tokens - new_tokens
        
        self.last_condensation = time.time()
        self.condensation_count += 1
        
        return {
            'action': 'condensed',
            'token_savings': token_savings,
            'original_tokens': original_tokens,
            'new_tokens': new_tokens,
            'messages_summarized': len(messages_to_summarize),
            'chunks_created': len(new_chunks),
            'summary_version': self.session_memory.summary_version
        }
    
    async def _create_rolling_summary(self, messages: List[Message], llm_function) -> str:
        """Create an efficient rolling summary focused on essential context"""
        if not messages:
            return self.session_memory.rolling_summary
        
        # Convert messages to conversation text
        conversation_text = ""
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            conversation_text += f"{role_label}: {msg.content}\n\n"
        
        # Create enhanced summarization prompt
        summary_prompt = f"""Update this conversation summary with new information. Focus on:
1. Key decisions made ([Decision]: format)
2. Important constraints ([Constraint]: format) 
3. Factual discoveries ([Fact]: format)
4. Current working context

Previous summary: {self.session_memory.rolling_summary or 'None'}

New conversation:
{conversation_text}

Updated summary (max 100 words, use tags):"""

        try:
            response = await llm_function(summary_prompt)
            return response.strip()
        except Exception as e:
            logger.error(f"Summary creation failed: {e}")
            # Fallback: simple concatenation
            fallback_summary = f"Recent conversation about {self._extract_topic(conversation_text)}"
            return fallback_summary if len(fallback_summary) < 200 else fallback_summary[:200]
    
    async def _extract_constraints_decisions(self, messages: List[Message], llm_function):
        """Extract and formalize constraints and decisions"""
        if not messages:
            return
        
        conversation_text = ""
        for msg in messages[-5:]:  # Focus on recent messages for extraction
            conversation_text += f"{msg.role}: {msg.content}\n"
        
        extraction_prompt = f"""Extract any explicit decisions or constraints from this conversation. Return as JSON:

{conversation_text}

Format:
{{"decisions": ["Decision: Use X for Y"], "constraints": ["Constraint: Must avoid Z"]}}

JSON:"""

        try:
            response = await llm_function(extraction_prompt)
            # Simple JSON parsing attempt
            if '{' in response and '}' in response:
                json_str = response[response.find('{'):response.rfind('}')+1]
                extracted = json.loads(json_str)
                
                if 'decisions' in extracted:
                    self.session_memory.constraints_decisions.extend(extracted['decisions'])
                if 'constraints' in extracted:
                    self.session_memory.constraints_decisions.extend(extracted['constraints'])
                
                # Keep only unique items and limit to 10
                self.session_memory.constraints_decisions = list(set(
                    self.session_memory.constraints_decisions
                ))[-10:]
                
        except Exception as e:
            logger.error(f"Constraint extraction failed: {e}")
    
    def _extract_topic(self, text: str) -> str:
        """Extract the main topic from conversation text"""
        # Simple topic extraction using common words
        words = re.findall(r'\w+', text.lower())
        word_freq = {}
        
        # Skip common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'}
        
        for word in words:
            if len(word) > 3 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        if word_freq:
            top_word = max(word_freq, key=word_freq.get)
            return top_word
        
        return "general discussion"
    
    def build_context_for_llm(self, current_query: str = "") -> List[Dict[str, str]]:
        """
        Build optimized context for LLM following the recommended patterns
        """
        context_messages = []
        
        # 1. System message with constraints & decisions
        if self.session_memory.constraints_decisions:
            constraints_text = "\n".join(self.session_memory.constraints_decisions)
            context_messages.append({
                "role": "system",
                "content": f"Context Constraints & Decisions:\n{constraints_text}"
            })
        
        # 2. Rolling summary (if exists)
        if self.session_memory.rolling_summary:
            context_messages.append({
                "role": "system", 
                "content": f"Previous conversation summary: {self.session_memory.rolling_summary}"
            })
        
        # 3. Retrieved relevant context (RAG)
        if current_query:
            relevant_chunks = self.semantic_retrieval(current_query, max_chunks=3)
            if relevant_chunks:
                retrieved_content = "\n\n".join([
                    f"[Relevant context from {chunk.chunk_type}]: {chunk.content}" 
                    for chunk in relevant_chunks
                ])
                context_messages.append({
                    "role": "system",
                    "content": f"Relevant previous context:\n{retrieved_content}"
                })
        
        # 4. Recent conversation turns
        recent_messages = self.messages[-self.recent_window_size:]
        for msg in recent_messages:
            context_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        return context_messages
    
    def get_context_stats(self) -> Dict[str, Any]:
        """Get comprehensive context statistics"""
        token_breakdown = self.estimate_context_tokens()
        
        return {
            'total_messages': len(self.messages),
            'context_chunks': len(self.context_chunks),
            'token_breakdown': token_breakdown,
            'usage_percentage': (token_breakdown['total'] / self.available_tokens) * 100,
            'condensation_count': self.condensation_count,
            'last_condensation': self.last_condensation,
            'needs_condensation': self.needs_condensation(),
            'constraints_decisions': len(self.session_memory.constraints_decisions),
            'has_summary': bool(self.session_memory.rolling_summary),
            'summary_version': self.session_memory.summary_version,
            'available_tokens': self.available_tokens,
            'max_tokens': self.max_tokens
        }

# Global instance
context_manager = ContextManager()