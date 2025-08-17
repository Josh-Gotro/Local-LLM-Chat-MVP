import { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.75rem;
    font-size: 0.65rem;
  }
`

const ContextSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const TokenBar = styled.div`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 60px;
    height: 3px;
  }
`

const TokenFill = styled.div`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: ${props => {
    if (props.$isProcessing) return 'linear-gradient(90deg, rgba(255, 167, 38, 0.9), rgba(255, 107, 107, 0.9))';
    if (props.$percentage >= 90) return 'rgba(255, 107, 107, 0.8)';
    if (props.$percentage >= 70) return 'rgba(255, 167, 38, 0.8)';
    return 'rgba(78, 205, 196, 0.8)';
  }};
  transition: all 0.3s ease;
  border-radius: 2px;
  ${props => props.$isProcessing && css`animation: ${pulse} 1.5s infinite;`}
`

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.6rem;
  color: ${props => {
    if (props.$type === 'enhanced') return 'rgba(78, 205, 196, 0.9)';
    if (props.$type === 'warning') return 'rgba(255, 167, 38, 0.9)';
    if (props.$type === 'processing') return 'rgba(255, 167, 38, 0.9)';
    return 'rgba(255, 255, 255, 0.7)';
  }};
  border: 1px solid ${props => {
    if (props.$type === 'enhanced') return 'rgba(78, 205, 196, 0.3)';
    if (props.$type === 'warning') return 'rgba(255, 167, 38, 0.3)';
    if (props.$type === 'processing') return 'rgba(255, 167, 38, 0.3)';
    return 'rgba(255, 255, 255, 0.2)';
  }};

  &::before {
    content: '${props => props.$icon || '●'}';
    ${props => props.$type === 'processing' && css`animation: ${pulse} 1s infinite;`}
  }
`

const ActionButton = styled.button`
  background: rgba(187, 134, 252, 0.2);
  border: 1px solid rgba(187, 134, 252, 0.4);
  color: rgba(187, 134, 252, 0.9);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(187, 134, 252, 0.3);
    border-color: rgba(187, 134, 252, 0.6);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

function ContextTracker({ 
  sessionId = "default", 
  onClearConversation,
  isVisible = true,
  isEnhanced = false // Whether to show enhanced features
}) {
  const [contextStats, setContextStats] = useState(null)
  const [isCondensing, setIsCondensing] = useState(false)

  useEffect(() => {
    if (isVisible && isEnhanced) {
      fetchContextStats()
      const interval = setInterval(fetchContextStats, 5000)
      return () => clearInterval(interval)
    }
  }, [sessionId, isVisible, isEnhanced])

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

  const handleClearConversation = async () => {
    if (isEnhanced) {
      // Enhanced mode: clear both UI and backend context
      try {
        await fetch(`/api/context/${sessionId}`, { method: 'DELETE' })
        onClearConversation?.()
        await fetchContextStats()
      } catch (error) {
        console.error('[CONTEXT] Failed to clear context:', error)
        onClearConversation?.() // Fallback to UI-only clear
      }
    } else {
      // Legacy mode: just clear UI
      onClearConversation?.()
    }
  }

  if (!isVisible) return null

  // Legacy mode: use provided contextInfo or simple display
  if (!isEnhanced) {
    return (
      <Container>
        <ContextSection>
          <span>Context</span>
          <TokenBar>
            <TokenFill $percentage={0} />
          </TokenBar>
          <span>Basic Mode</span>
        </ContextSection>
        <ActionButton onClick={handleClearConversation}>
          Clear Chat
        </ActionButton>
      </Container>
    )
  }

  // Enhanced mode: use real context stats
  if (!contextStats) {
    return (
      <Container>
        <StatusBadge $type="processing" $icon="⚡">
          Loading context...
        </StatusBadge>
      </Container>
    )
  }

  const percentage = contextStats.usage_percentage || 0
  const isProcessing = isCondensing || contextStats.needs_condensation
  const hasMemory = contextStats.has_summary || contextStats.condensation_count > 0

  return (
    <Container>
      <ContextSection>
        <span>Context: {Math.round(percentage)}%</span>
        <TokenBar>
          <TokenFill 
            $percentage={percentage} 
            $isProcessing={isProcessing}
          />
        </TokenBar>
        <span>{contextStats.total_messages || 0} msgs</span>
      </ContextSection>

      <ContextSection>
        {hasMemory && (
          <StatusBadge $type="enhanced" $icon="🧠">
            Enhanced
          </StatusBadge>
        )}
        
        {contextStats.needs_condensation && (
          <StatusBadge $type="warning" $icon="⚠">
            Will Condense
          </StatusBadge>
        )}
        
        {isProcessing && (
          <StatusBadge $type="processing" $icon="⚡">
            Processing
          </StatusBadge>
        )}
      </ContextSection>

      <ContextSection>
        <ActionButton onClick={handleClearConversation}>
          Clear
        </ActionButton>
      </ContextSection>
    </Container>
  )
}

export default ContextTracker