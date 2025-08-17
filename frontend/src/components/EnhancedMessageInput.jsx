import { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'

const Form = styled.form`
  border-top: 1px solid rgba(187, 134, 252, 0.3);
  padding-top: 1rem;

  @media (prefers-color-scheme: light) {
    border-top-color: rgba(187, 134, 252, 0.3);
  }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`

const ContextFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 12px;
  animation: ${slideIn} 0.3s ease-out;

  @media (max-width: 768px) {
    gap: 0.75rem;
    padding: 0.75rem;
  }
`

const ContextHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const ContextTitle = styled.h4`
  margin: 0;
  font-size: 0.8rem;
  color: rgba(187, 134, 252, 0.9);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ContextMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`

const Metric = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const MetricValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => {
    if (props.$type === 'danger') return 'rgba(255, 107, 107, 0.9)';
    if (props.$type === 'warning') return 'rgba(255, 167, 38, 0.9)';
    if (props.$type === 'success') return 'rgba(78, 205, 196, 0.9)';
    if (props.$type === 'info') return 'rgba(187, 134, 252, 0.9)';
    return 'rgba(255, 255, 255, 0.9)';
  }};
`

const MetricLabel = styled.div`
  font-size: 0.6rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
`

const ContextBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 0.75rem 0;
  position: relative;
`

const ContextFill = styled.div`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: ${props => {
    if (props.$isProcessing) return 'linear-gradient(90deg, rgba(255, 167, 38, 0.9), rgba(255, 107, 107, 0.9))';
    if (props.$percentage >= 90) return 'linear-gradient(90deg, rgba(255, 107, 107, 0.8), rgba(255, 167, 38, 0.8))';
    if (props.$percentage >= 70) return 'rgba(255, 167, 38, 0.8)';
    return 'rgba(78, 205, 196, 0.8)';
  }};
  transition: all 0.3s ease;
  border-radius: 4px;
  ${props => props.$isProcessing && css`animation: ${pulse} 1.5s infinite;`}
`

const ContextInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
`

const StatusIndicators = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.75rem;
    justify-content: center;
  }
`

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 0.65rem;
  color: ${props => {
    if (props.$type === 'condensed') return 'rgba(78, 205, 196, 0.9)';
    if (props.$type === 'warning') return 'rgba(255, 167, 38, 0.9)';
    if (props.$type === 'active') return 'rgba(187, 134, 252, 0.9)';
    if (props.$type === 'processing') return 'rgba(255, 167, 38, 0.9)';
    return 'rgba(255, 255, 255, 0.7)';
  }};
  border: 1px solid ${props => {
    if (props.$type === 'condensed') return 'rgba(78, 205, 196, 0.3)';
    if (props.$type === 'warning') return 'rgba(255, 167, 38, 0.3)';
    if (props.$type === 'active') return 'rgba(187, 134, 252, 0.3)';
    if (props.$type === 'processing') return 'rgba(255, 167, 38, 0.3)';
    return 'rgba(255, 255, 255, 0.2)';
  }};

  &::before {
    content: '${props => props.$icon || '●'}';
    ${props => props.$type === 'processing' && css`animation: ${pulse} 1s infinite;`}
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`

const ActionButton = styled.button`
  background: ${props => {
    if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.2)';
    if (props.$variant === 'warning') return 'rgba(255, 167, 38, 0.2)';
    return 'rgba(187, 134, 252, 0.2)';
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.4)';
    if (props.$variant === 'warning') return 'rgba(255, 167, 38, 0.4)';
    return 'rgba(187, 134, 252, 0.4)';
  }};
  color: ${props => {
    if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.9)';
    if (props.$variant === 'warning') return 'rgba(255, 167, 38, 0.9)';
    return 'rgba(187, 134, 252, 0.9)';
  }};
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.3)';
      if (props.$variant === 'warning') return 'rgba(255, 167, 38, 0.3)';
      return 'rgba(187, 134, 252, 0.3)';
    }};
    border-color: ${props => {
      if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.6)';
      if (props.$variant === 'warning') return 'rgba(255, 167, 38, 0.6)';
      return 'rgba(187, 134, 252, 0.6)';
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const InputContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
`

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;

  @media (max-width: 768px) {
    width: 100%;
    gap: 0.5rem;
  }
`

const TextArea = styled.textarea`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  max-height: 200px;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #ff4081;
    box-shadow: 
      0 0 0 2px rgba(255, 64, 129, 0.2),
      0 0 20px rgba(255, 64, 129, 0.1);
    background: rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    min-height: 60px;
  }

  @media (min-width: 1025px) {
    min-height: 100px;
  }
`

const SendButton = styled.button`
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  background: linear-gradient(45deg, #ff4081, #bb86fc);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 
    0 4px 15px rgba(255, 64, 129, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #ff6b9d, #d1a3ff);
    transform: translateY(-1px);
    box-shadow: 
      0 6px 20px rgba(255, 64, 129, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(100, 100, 100, 0.3);
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`

const SearchButton = styled.button`
  border-radius: 8px;
  border: 1px solid rgba(184, 134, 11, 0.3);
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  background: #b8860b;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 
    0 2px 8px rgba(184, 134, 11, 0.2);

  &:hover:not(:disabled) {
    background: #d4af37;
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(184, 134, 11, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    background: #a0751a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(100, 100, 100, 0.3);
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`

function EnhancedMessageInput({ 
  onSendMessage, 
  onSearchMessage, 
  isLoading, 
  sessionId = "default",
  onClearConversation,
  showContextTracker = true 
}) {
  const [input, setInput] = useState('')
  const [contextStats, setContextStats] = useState(null)
  const [isCondensing, setIsCondensing] = useState(false)

  // Fetch context stats periodically
  useEffect(() => {
    if (showContextTracker) {
      fetchContextStats()
      const interval = setInterval(fetchContextStats, 3000) // Every 3 seconds
      return () => clearInterval(interval)
    }
  }, [sessionId, showContextTracker])

  const fetchContextStats = async () => {
    try {
      const response = await fetch(`/api/context/stats/${sessionId}`)
      if (response.ok) {
        const stats = await response.json()
        setContextStats(stats)
      }
    } catch (error) {
      console.error('[CONTEXT] Failed to fetch stats:', error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
      // Refresh context stats after message
      setTimeout(fetchContextStats, 1000)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSearchMessage(input.trim())
      setInput('')
      setTimeout(fetchContextStats, 1000)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleForceCondense = async () => {
    setIsCondensing(true)
    try {
      const response = await fetch('/api/context/condense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          model: 'qwen3:latest'
        })
      })

      if (response.ok) {
        await fetchContextStats()
      }
    } catch (error) {
      console.error('[CONTEXT] Force condensation failed:', error)
    } finally {
      setIsCondensing(false)
    }
  }

  const handleClearContext = async () => {
    if (confirm('Clear all conversation context? This will start a fresh conversation.')) {
      try {
        await fetch(`/api/context/${sessionId}`, { method: 'DELETE' })
        onClearConversation?.()
        await fetchContextStats()
      } catch (error) {
        console.error('[CONTEXT] Failed to clear context:', error)
      }
    }
  }

  const getContextType = (percentage) => {
    if (percentage >= 90) return 'danger'
    if (percentage >= 70) return 'warning'
    return 'success'
  }

  const getMemoryInfo = () => {
    if (!contextStats) return { chunks: 0, condensations: 0, hasMemory: false }
    
    return {
      chunks: contextStats.context_chunks || 0,
      condensations: contextStats.condensation_count || 0,
      hasMemory: contextStats.has_summary || false
    }
  }

  const memoryInfo = getMemoryInfo()
  const percentage = contextStats?.usage_percentage || 0
  const contextType = getContextType(percentage)
  const isProcessing = isLoading || isCondensing || contextStats?.needs_condensation

  return (
    <Form onSubmit={handleSubmit}>
      <InputContainer>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows="3"
        />
        <ButtonContainer>
          <SearchButton 
            type="button"
            onClick={handleSearch}
            disabled={!input.trim() || isLoading}
          >
            🦆🦆→
          </SearchButton>
          <SendButton 
            type="submit" 
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </SendButton>
        </ButtonContainer>
      </InputContainer>
      
      {showContextTracker && contextStats && (
        <ContextFooter>
          <ContextHeader>
            <ContextTitle>
              🧠 Enhanced Context Tracker
            </ContextTitle>
          </ContextHeader>

          <ContextMetrics>
            <Metric>
              <MetricValue $type={contextType}>
                {Math.round(percentage)}%
              </MetricValue>
              <MetricLabel>Context Usage</MetricLabel>
            </Metric>
            
            <Metric>
              <MetricValue $type="info">
                {contextStats.total_messages || 0}
              </MetricValue>
              <MetricLabel>Messages</MetricLabel>
            </Metric>
            
            <Metric>
              <MetricValue $type="success">
                {memoryInfo.chunks}
              </MetricValue>
              <MetricLabel>Memory Chunks</MetricLabel>
            </Metric>
            
            <Metric>
              <MetricValue $type="warning">
                {memoryInfo.condensations}
              </MetricValue>
              <MetricLabel>Condensations</MetricLabel>
            </Metric>
          </ContextMetrics>

          <ContextBar>
            <ContextFill 
              $percentage={percentage} 
              $isProcessing={isProcessing}
            />
          </ContextBar>

          <ContextInfo>
            <span>{contextStats.token_breakdown?.total || 0} / {contextStats.max_tokens || 4000} tokens</span>
            
            <StatusIndicators>
              {memoryInfo.hasMemory && (
                <StatusBadge $type="condensed" $icon="✓">
                  Memory Active
                </StatusBadge>
              )}
              
              {contextStats.needs_condensation && (
                <StatusBadge $type="warning" $icon="⚠">
                  Needs Condensation
                </StatusBadge>
              )}
              
              {isProcessing && (
                <StatusBadge $type="processing" $icon="⚡">
                  Processing...
                </StatusBadge>
              )}
              
              {!isProcessing && !contextStats.needs_condensation && (
                <StatusBadge $type="active" $icon="●">
                  Optimal
                </StatusBadge>
              )}
            </StatusIndicators>
          </ContextInfo>

          <ActionButtons>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <ActionButton 
                onClick={handleForceCondense}
                disabled={isCondensing || contextStats.total_messages < 3}
                $variant="warning"
              >
                {isCondensing ? 'Condensing...' : 'Force Condense'}
              </ActionButton>
              
              <ActionButton onClick={handleClearContext} $variant="danger">
                Clear Context
              </ActionButton>
            </div>
            
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
              Session: {sessionId}
            </span>
          </ActionButtons>
        </ContextFooter>
      )}
    </Form>
  )
}

export default EnhancedMessageInput