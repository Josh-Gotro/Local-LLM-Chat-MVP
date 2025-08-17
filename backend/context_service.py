"""
Context Service for Enhanced Context Management
Provides API endpoints for context management operations
"""

import json
import httpx
import os
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from context_manager import ContextManager, Message
from context_hygiene import context_hygiene
import logging

logger = logging.getLogger(__name__)

class ContextService:
    """Service layer for context management operations"""
    
    def __init__(self, ollama_url: str):
        self.ollama_url = ollama_url
        self.sessions: Dict[str, ContextManager] = {}  # session_id -> ContextManager
        
        # Get configurable context limits from environment
        self.default_max_tokens = int(os.getenv("CONTEXT_MAX_TOKENS", "32000"))
        self.default_reply_reserve_ratio = float(os.getenv("CONTEXT_REPLY_RESERVE_RATIO", "0.25"))
        self.default_recent_window_size = int(os.getenv("CONTEXT_RECENT_WINDOW_SIZE", "8"))
    
    def get_or_create_session(self, session_id: str = "default") -> ContextManager:
        """Get existing session or create new one"""
        if session_id not in self.sessions:
            self.sessions[session_id] = ContextManager(
                max_tokens=self.default_max_tokens,
                reply_reserve_ratio=self.default_reply_reserve_ratio,
                recent_window_size=self.default_recent_window_size
            )
        return self.sessions[session_id]
    
    async def llm_request(self, prompt: str, model: str = "qwen3:latest") -> str:
        """Make a simple LLM request for context operations"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.ollama_url,
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                
                result = response.json()
                return result.get("message", {}).get("content", "").strip()
                
        except Exception as e:
            logger.error(f"LLM request failed: {e}")
            raise HTTPException(status_code=500, detail=f"LLM request failed: {str(e)}")
    
    async def add_message_to_context(self, 
                                   session_id: str,
                                   role: str, 
                                   content: str,
                                   model: str = "qwen3:latest") -> Dict[str, Any]:
        """Add a message to context and handle condensation if needed"""
        context_manager = self.get_or_create_session(session_id)
        
        # Validate and sanitize message using hygiene system
        validation = context_hygiene.validate_message(content, role)
        
        if not validation.is_valid and not validation.sanitized_content:
            raise HTTPException(
                status_code=400, 
                detail=f"Message validation failed: {', '.join(validation.issues)}"
            )
        
        # Use sanitized content if available
        final_content = validation.sanitized_content or content
        
        # Add the message
        message = context_manager.add_message(role, final_content)
        
        # Check for topic shifts
        recent_messages = [
            {'role': msg.role, 'content': msg.content} 
            for msg in context_manager.messages[-3:]
        ]
        topic_shifted = context_hygiene.detect_topic_shift(recent_messages)
        
        # Check if condensation is needed
        condensation_result = None
        if context_manager.needs_condensation():
            condensation_result = await context_manager.condense_context(
                lambda prompt: self.llm_request(prompt, model)
            )
        
        # Get current context stats
        stats = context_manager.get_context_stats()
        
        return {
            'message_added': {
                'id': message.message_id,
                'role': message.role,
                'content': message.content,
                'tokens': message.tokens,
                'sanitized': bool(validation.sanitized_content),
                'warnings': validation.warnings
            },
            'topic_shift_detected': topic_shifted,
            'condensation': condensation_result,
            'context_stats': stats
        }
    
    async def build_conversation_context(self,
                                       session_id: str,
                                       current_query: str = "",
                                       include_stats: bool = False) -> Dict[str, Any]:
        """Build optimized conversation context for LLM"""
        context_manager = self.get_or_create_session(session_id)
        
        # Build context messages
        context_messages = context_manager.build_context_for_llm(current_query)
        
        # Apply hygiene and guardrails
        validation = context_hygiene.validate_context_structure(context_messages)
        
        if not validation.is_valid:
            logger.warning(f"Context validation issues: {validation.issues}")
        
        # Optimize context ordering
        optimized_messages = context_hygiene.optimize_context_order(context_messages)
        
        # Clean the conversation history
        cleaned_messages = context_hygiene.clean_conversation_history(optimized_messages)
        
        result = {
            'messages': cleaned_messages,
            'token_count': sum(len(msg['content']) // 4 for msg in cleaned_messages),
            'hygiene_applied': True,
            'validation_warnings': validation.warnings if validation.warnings else None
        }
        
        if include_stats:
            result['stats'] = context_manager.get_context_stats()
        
        return result
    
    async def force_condensation(self,
                               session_id: str,
                               model: str = "qwen3:latest") -> Dict[str, Any]:
        """Force context condensation"""
        context_manager = self.get_or_create_session(session_id)
        
        if len(context_manager.messages) < 2:
            return {'action': 'no_condensation_needed', 'reason': 'insufficient_messages'}
        
        result = await context_manager.condense_context(
            lambda prompt: self.llm_request(prompt, model)
        )
        
        return {
            'condensation': result,
            'context_stats': context_manager.get_context_stats()
        }
    
    def get_context_stats(self, session_id: str) -> Dict[str, Any]:
        """Get context statistics for a session"""
        context_manager = self.get_or_create_session(session_id)
        return context_manager.get_context_stats()
    
    def get_session_memory(self, session_id: str) -> Dict[str, Any]:
        """Get session memory details"""
        context_manager = self.get_or_create_session(session_id)
        memory = context_manager.session_memory
        
        return {
            'profile': memory.profile,
            'constraints_decisions': memory.constraints_decisions,
            'canonical_facts': memory.canonical_facts,
            'entities': memory.entities,
            'current_topic': memory.current_topic,
            'working_context': memory.working_context,
            'rolling_summary': memory.rolling_summary,
            'summary_version': memory.summary_version
        }
    
    def update_session_memory(self,
                            session_id: str,
                            memory_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update session memory components"""
        context_manager = self.get_or_create_session(session_id)
        memory = context_manager.session_memory
        
        # Update allowed fields
        allowed_fields = ['profile', 'current_topic', 'working_context']
        for field in allowed_fields:
            if field in memory_updates:
                setattr(memory, field, memory_updates[field])
        
        # Special handling for constraints/decisions
        if 'add_constraint' in memory_updates:
            memory.constraints_decisions.append(memory_updates['add_constraint'])
        
        if 'add_canonical_fact' in memory_updates:
            key = memory_updates['add_canonical_fact']['key']
            value = memory_updates['add_canonical_fact']['value']
            memory.canonical_facts[key] = value
        
        return self.get_session_memory(session_id)
    
    def clear_session(self, session_id: str) -> Dict[str, str]:
        """Clear a session's context"""
        if session_id in self.sessions:
            del self.sessions[session_id]
        
        return {'status': 'cleared', 'session_id': session_id}
    
    def get_conversation_history(self, 
                               session_id: str,
                               limit: Optional[int] = None) -> Dict[str, Any]:
        """Get conversation history with metadata"""
        context_manager = self.get_or_create_session(session_id)
        
        messages = context_manager.messages
        if limit:
            messages = messages[-limit:]
        
        return {
            'messages': [
                {
                    'id': msg.message_id,
                    'role': msg.role,
                    'content': msg.content,
                    'timestamp': msg.timestamp,
                    'tokens': msg.tokens,
                    'salience_score': msg.salience_score
                }
                for msg in messages
            ],
            'total_messages': len(context_manager.messages),
            'context_chunks': len(context_manager.context_chunks),
            'returned_messages': len(messages)
        }
    
    async def semantic_search_context(self,
                                    session_id: str,
                                    query: str,
                                    max_results: int = 5) -> Dict[str, Any]:
        """Search conversation context semantically"""
        context_manager = self.get_or_create_session(session_id)
        
        # Get relevant chunks
        relevant_chunks = context_manager.semantic_retrieval(query, max_results)
        
        return {
            'query': query,
            'results': [
                {
                    'content': chunk.content,
                    'chunk_type': chunk.chunk_type,
                    'timestamp': chunk.timestamp,
                    'tokens': chunk.tokens,
                    'message_ids': chunk.message_ids
                }
                for chunk in relevant_chunks
            ],
            'total_chunks_searched': len(context_manager.context_chunks),
            'results_returned': len(relevant_chunks)
        }
    
    def get_all_sessions(self) -> Dict[str, Any]:
        """Get information about all active sessions"""
        return {
            'active_sessions': list(self.sessions.keys()),
            'session_count': len(self.sessions),
            'session_stats': {
                session_id: manager.get_context_stats()
                for session_id, manager in self.sessions.items()
            }
        }
    
    def get_hygiene_report(self, session_id: str) -> Dict[str, Any]:
        """Generate context hygiene report for a session"""
        context_manager = self.get_or_create_session(session_id)
        
        # Convert messages to dict format
        messages = [
            {
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp,
                'tokens': msg.tokens
            }
            for msg in context_manager.messages
        ]
        
        # Convert context chunks to dict format
        context_chunks = [
            {
                'content': chunk.content,
                'chunk_type': chunk.chunk_type,
                'timestamp': chunk.timestamp,
                'tokens': chunk.tokens
            }
            for chunk in context_manager.context_chunks
        ]
        
        # Get session memory
        memory = {
            'constraints_decisions': context_manager.session_memory.constraints_decisions,
            'canonical_facts': context_manager.session_memory.canonical_facts,
            'rolling_summary': context_manager.session_memory.rolling_summary
        }
        
        return context_hygiene.generate_hygiene_report(messages, context_chunks, memory)
    
    def get_context_config(self) -> Dict[str, Any]:
        """Get current context configuration"""
        return {
            'max_tokens': self.default_max_tokens,
            'reply_reserve_ratio': self.default_reply_reserve_ratio,
            'recent_window_size': self.default_recent_window_size,
            'available_tokens': int(self.default_max_tokens * (1 - self.default_reply_reserve_ratio)),
            'condensation_threshold': 0.90,
            'max_messages_before_condensation': 50
        }

# Factory function to create context service
def create_context_service(ollama_url: str) -> ContextService:
    return ContextService(ollama_url)