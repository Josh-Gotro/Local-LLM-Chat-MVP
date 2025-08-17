"""
Context Hygiene and Guardrails System
Implements validation, sanitization, and safety checks for context management
"""

import re
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    is_valid: bool
    issues: List[str]
    warnings: List[str]
    sanitized_content: str = None

class ContextHygiene:
    """
    Implements context hygiene rules and guardrails
    """
    
    def __init__(self):
        # Content safety patterns
        self.sensitive_patterns = [
            r'\b(?:password|token|secret|key|api_key)\s*[:=]\s*\S+',
            r'\b(?:credit card|ssn|social security)\b',
            r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card patterns
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN pattern
        ]
        
        # Topic coherence patterns
        self.topic_shift_indicators = [
            r'\b(?:now let\'s|moving on|switching to|different topic)\b',
            r'\b(?:by the way|btw|off topic|unrelated)\b',
            r'\b(?:new question|different question|change of subject)\b'
        ]
        
        # Quality control patterns
        self.low_quality_patterns = [
            r'^(?:ok|okay|yes|no|sure|thanks|thank you)\.?$',  # Single word responses
            r'^(?:lol|haha|hmm|uh|um|er)\.?$',  # Filler words
            r'^\.{3,}$',  # Just dots
            r'^[!@#$%^&*()]{3,}$',  # Just special characters
        ]
        
        # Context size thresholds
        self.max_message_length = 10000  # 10k characters per message
        self.max_chunk_size = 500  # 500 characters per context chunk
        self.min_chunk_size = 20   # Minimum meaningful chunk size
        
    def validate_message(self, content: str, role: str) -> ValidationResult:
        """Validate a single message for content safety and quality"""
        issues = []
        warnings = []
        sanitized_content = content
        
        # Basic validation
        if not content or not content.strip():
            issues.append("Empty or whitespace-only content")
            return ValidationResult(False, issues, warnings)
        
        # Length validation
        if len(content) > self.max_message_length:
            warnings.append(f"Message exceeds recommended length ({len(content)} > {self.max_message_length})")
            sanitized_content = content[:self.max_message_length] + "... [truncated]"
        
        # Sensitive information detection
        for pattern in self.sensitive_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append("Potentially sensitive information detected")
                # Replace with placeholder
                sanitized_content = re.sub(pattern, "[REDACTED]", sanitized_content, flags=re.IGNORECASE)
        
        # Quality checks for user messages
        if role == "user":
            if re.match(r'|'.join(self.low_quality_patterns), content.strip(), re.IGNORECASE):
                warnings.append("Low-quality or very short message detected")
        
        # Character encoding validation
        try:
            content.encode('utf-8')
        except UnicodeEncodeError:
            issues.append("Invalid character encoding")
        
        is_valid = len(issues) == 0
        return ValidationResult(is_valid, issues, warnings, sanitized_content)
    
    def detect_topic_shift(self, recent_messages: List[Dict[str, str]]) -> bool:
        """Detect if there's been a significant topic shift"""
        if len(recent_messages) < 2:
            return False
        
        latest_message = recent_messages[-1].get('content', '')
        
        # Check for explicit topic shift indicators
        for pattern in self.topic_shift_indicators:
            if re.search(pattern, latest_message, re.IGNORECASE):
                return True
        
        # Simple keyword-based topic shift detection
        if len(recent_messages) >= 3:
            # Get keywords from last 3 messages
            all_words = []
            for msg in recent_messages[-3:]:
                words = re.findall(r'\b\w{4,}\b', msg.get('content', '').lower())
                all_words.extend(words)
            
            # Check if latest message shares few keywords with previous messages
            latest_words = set(re.findall(r'\b\w{4,}\b', latest_message.lower()))
            previous_words = set(all_words[:-len(latest_words)])
            
            if latest_words and previous_words:
                overlap = len(latest_words.intersection(previous_words))
                overlap_ratio = overlap / min(len(latest_words), len(previous_words))
                return overlap_ratio < 0.2  # Less than 20% overlap suggests topic shift
        
        return False
    
    def sanitize_context_chunk(self, chunk_content: str) -> str:
        """Sanitize context chunk content"""
        # Remove excessive whitespace
        sanitized = re.sub(r'\s+', ' ', chunk_content.strip())
        
        # Remove sensitive patterns
        for pattern in self.sensitive_patterns:
            sanitized = re.sub(pattern, "[REDACTED]", sanitized, flags=re.IGNORECASE)
        
        # Truncate if too long
        if len(sanitized) > self.max_chunk_size:
            sanitized = sanitized[:self.max_chunk_size] + "..."
        
        return sanitized
    
    def validate_context_structure(self, context_messages: List[Dict[str, str]]) -> ValidationResult:
        """Validate the overall context structure"""
        issues = []
        warnings = []
        
        if not context_messages:
            issues.append("Empty context")
            return ValidationResult(False, issues, warnings)
        
        # Check for valid message structure
        for i, msg in enumerate(context_messages):
            if 'role' not in msg or 'content' not in msg:
                issues.append(f"Message {i} missing required fields")
            
            if msg.get('role') not in ['system', 'user', 'assistant']:
                warnings.append(f"Message {i} has unusual role: {msg.get('role')}")
        
        # Check for reasonable conversation flow
        roles = [msg.get('role') for msg in context_messages if msg.get('role') in ['user', 'assistant']]
        
        # Look for role alternation breaks
        for i in range(1, len(roles)):
            if roles[i] == roles[i-1] and roles[i] in ['user', 'assistant']:
                warnings.append(f"Unusual conversation flow: consecutive {roles[i]} messages")
        
        # Check total context size
        total_chars = sum(len(msg.get('content', '')) for msg in context_messages)
        if total_chars > 20000:  # 20k characters
            warnings.append(f"Large context size: {total_chars} characters")
        
        is_valid = len(issues) == 0
        return ValidationResult(is_valid, issues, warnings)
    
    def clean_conversation_history(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and optimize conversation history"""
        cleaned_messages = []
        
        for msg in messages:
            # Validate and sanitize each message
            content = msg.get('content', '')
            role = msg.get('role', 'user')
            
            validation = self.validate_message(content, role)
            
            if validation.is_valid or validation.sanitized_content:
                cleaned_msg = msg.copy()
                cleaned_msg['content'] = validation.sanitized_content or content
                
                # Add metadata about cleaning
                if validation.warnings or validation.issues:
                    cleaned_msg['hygiene_notes'] = {
                        'warnings': validation.warnings,
                        'issues': validation.issues,
                        'cleaned': bool(validation.sanitized_content)
                    }
                
                cleaned_messages.append(cleaned_msg)
            else:
                logger.warning(f"Excluding message due to validation issues: {validation.issues}")
        
        return cleaned_messages
    
    def optimize_context_order(self, context_messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Optimize context message ordering following best practices"""
        # Separate message types
        system_messages = []
        constraint_messages = []
        summary_messages = []
        conversation_messages = []
        
        for msg in context_messages:
            content = msg.get('content', '').lower()
            role = msg.get('role', '')
            
            if role == 'system':
                if 'constraint' in content or 'decision' in content:
                    constraint_messages.append(msg)
                elif 'summary' in content or 'context' in content:
                    summary_messages.append(msg)
                else:
                    system_messages.append(msg)
            else:
                conversation_messages.append(msg)
        
        # Optimal ordering: system -> constraints -> summary -> conversation
        optimized_order = (
            system_messages + 
            constraint_messages + 
            summary_messages + 
            conversation_messages
        )
        
        return optimized_order
    
    def detect_context_conflicts(self, session_memory: Dict[str, Any]) -> List[str]:
        """Detect conflicts in session memory"""
        conflicts = []
        
        constraints = session_memory.get('constraints_decisions', [])
        facts = session_memory.get('canonical_facts', {})
        
        # Check for contradictory constraints
        for i, constraint1 in enumerate(constraints):
            for j, constraint2 in enumerate(constraints[i+1:], i+1):
                if self._are_contradictory(constraint1, constraint2):
                    conflicts.append(f"Contradictory constraints: {constraint1} vs {constraint2}")
        
        # Check for conflicting facts
        for key, value in facts.items():
            for other_key, other_value in facts.items():
                if key != other_key and self._facts_conflict(key, value, other_key, other_value):
                    conflicts.append(f"Conflicting facts: {key}={value} vs {other_key}={other_value}")
        
        return conflicts
    
    def _are_contradictory(self, statement1: str, statement2: str) -> bool:
        """Simple heuristic to detect contradictory statements"""
        # Look for opposing keywords
        opposing_pairs = [
            ('must', 'must not'),
            ('should', 'should not'),
            ('always', 'never'),
            ('required', 'forbidden'),
            ('use', 'avoid'),
            ('include', 'exclude')
        ]
        
        s1_lower = statement1.lower()
        s2_lower = statement2.lower()
        
        for pos, neg in opposing_pairs:
            if pos in s1_lower and neg in s2_lower:
                # Check if they're talking about the same thing
                s1_words = set(re.findall(r'\b\w{4,}\b', s1_lower))
                s2_words = set(re.findall(r'\b\w{4,}\b', s2_lower))
                overlap = len(s1_words.intersection(s2_words))
                if overlap >= 2:  # At least 2 common words
                    return True
        
        return False
    
    def _facts_conflict(self, key1: str, value1: str, key2: str, value2: str) -> bool:
        """Detect conflicting facts"""
        # If keys are similar, values should be compatible
        key_similarity = len(set(key1.lower().split()).intersection(set(key2.lower().split())))
        
        if key_similarity >= 2:  # Similar keys
            # Check if values are contradictory
            if value1.lower() != value2.lower():
                # Simple contradiction detection
                contradictory_words = [
                    ('yes', 'no'), ('true', 'false'), ('enabled', 'disabled'),
                    ('on', 'off'), ('allow', 'deny'), ('accept', 'reject')
                ]
                
                v1_lower = value1.lower()
                v2_lower = value2.lower()
                
                for word1, word2 in contradictory_words:
                    if word1 in v1_lower and word2 in v2_lower:
                        return True
                    if word2 in v1_lower and word1 in v2_lower:
                        return True
        
        return False
    
    def generate_hygiene_report(self, 
                              messages: List[Dict[str, Any]], 
                              context_chunks: List[Dict[str, Any]],
                              session_memory: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive hygiene report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'message_analysis': {
                'total_messages': len(messages),
                'issues_found': 0,
                'warnings': 0,
                'sanitized_messages': 0
            },
            'context_analysis': {
                'total_chunks': len(context_chunks),
                'chunk_size_distribution': {},
                'quality_score': 0
            },
            'memory_analysis': {
                'conflicts_detected': [],
                'constraint_count': len(session_memory.get('constraints_decisions', [])),
                'fact_count': len(session_memory.get('canonical_facts', {}))
            },
            'recommendations': []
        }
        
        # Analyze messages
        for msg in messages:
            validation = self.validate_message(msg.get('content', ''), msg.get('role', ''))
            if validation.issues:
                report['message_analysis']['issues_found'] += len(validation.issues)
            if validation.warnings:
                report['message_analysis']['warnings'] += len(validation.warnings)
            if validation.sanitized_content:
                report['message_analysis']['sanitized_messages'] += 1
        
        # Analyze context chunks
        chunk_sizes = [len(chunk.get('content', '')) for chunk in context_chunks]
        if chunk_sizes:
            report['context_analysis']['chunk_size_distribution'] = {
                'min': min(chunk_sizes),
                'max': max(chunk_sizes),
                'avg': sum(chunk_sizes) / len(chunk_sizes)
            }
            
            # Quality score based on chunk size distribution
            optimal_size = 200  # Optimal chunk size
            size_variance = sum((size - optimal_size) ** 2 for size in chunk_sizes) / len(chunk_sizes)
            report['context_analysis']['quality_score'] = max(0, 100 - (size_variance / 100))
        
        # Analyze memory conflicts
        conflicts = self.detect_context_conflicts(session_memory)
        report['memory_analysis']['conflicts_detected'] = conflicts
        
        # Generate recommendations
        if report['message_analysis']['issues_found'] > 0:
            report['recommendations'].append("Review messages for sensitive information")
        
        if report['context_analysis']['quality_score'] < 70:
            report['recommendations'].append("Optimize context chunk sizes")
        
        if len(conflicts) > 0:
            report['recommendations'].append("Resolve memory conflicts")
        
        if report['message_analysis']['sanitized_messages'] / max(1, len(messages)) > 0.1:
            report['recommendations'].append("High sanitization rate - review content policies")
        
        return report

# Global instance
context_hygiene = ContextHygiene()