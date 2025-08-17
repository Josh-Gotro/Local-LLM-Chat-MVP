import { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`

const Container = styled.div`
  background: ${props => props.$compact ? 'transparent' : 'rgba(0, 0, 0, 0.4)'};
  backdrop-filter: ${props => props.$compact ? 'none' : 'blur(8px)'};
  border: ${props => props.$compact ? 'none' : '1px solid rgba(187, 134, 252, 0.2)'};
  border-radius: ${props => props.$compact ? '0' : '12px'};
  padding: ${props => props.$compact ? '0.5rem 0' : '1rem'};
  margin: ${props => props.$compact ? '0.5rem 0 0 0' : '0 0 1rem 0'};
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  transition: all 0.3s ease;
  text-align: ${props => props.$compact ? 'center' : 'left'};
`

const CompactContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);

  @media (max-width: 768px) {
    gap: 0.5rem;
    font-size: 0.65rem;
  }
`

const CompactLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const CompactRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ContextLabel = styled.span`
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
`

const ContextPercent = styled.div`
  font-size: 0.7rem;
  font-weight: 500;
  color: ${props => {
    if (props.$percentage >= 90) return 'rgba(255, 107, 107, 0.8)';
    if (props.$percentage >= 70) return 'rgba(255, 167, 38, 0.8)';
    return 'rgba(78, 205, 196, 0.8)';
  }};
  min-width: 35px;
  text-align: right;
`

const CompactTokenBar = styled.div`
  width: 50px;
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 35px;
    height: 2px;
  }
`

const CompactTokenFill = styled.div`
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

const CondensingAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: rgba(255, 167, 38, 0.8);
  animation: ${pulse} 1.5s infinite;

  &::before {
    content: '⚡';
  }
`

const ExpandButton = styled.button`
  background: transparent;
  border: 1px solid rgba(187, 134, 252, 0.3);
  color: rgba(187, 134, 252, 0.7);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    color: rgba(187, 134, 252, 1);
    background: rgba(187, 134, 252, 0.1);
    border-color: rgba(187, 134, 252, 0.5);
  }
`

const CompactClearButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: rgba(255, 107, 107, 0.7);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: rgba(255, 107, 107, 1);
    background: rgba(255, 107, 107, 0.1);
    border-color: rgba(255, 107, 107, 0.5);
  }
`

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
`

const Title = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  color: rgba(187, 134, 252, 0.9);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const MemoryLanes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const MemoryLane = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid ${props => props.$color || 'rgba(187, 134, 252, 0.6)'};
`

const LaneTitle = styled.div`
  font-weight: 600;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  color: ${props => props.$color || 'rgba(187, 134, 252, 0.9)'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const LaneContent = styled.div`
  font-size: 0.7rem;
  line-height: 1.4;
  opacity: 0.85;
`

const ContextMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const Metric = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`

const MetricValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => {
    if (props.$type === 'danger') return 'rgba(255, 107, 107, 0.9)';
    if (props.$type === 'warning') return 'rgba(255, 167, 38, 0.9)';
    if (props.$type === 'success') return 'rgba(78, 205, 196, 0.9)';
    return 'rgba(255, 255, 255, 0.9)';
  }};
`

const MetricLabel = styled.div`
  font-size: 0.65rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
`

const TokenBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin: 0.75rem 0;
`

const TokenFill = styled.div`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: ${props => {
    if (props.$percentage >= 90) return 'linear-gradient(90deg, rgba(255, 107, 107, 0.8), rgba(255, 167, 38, 0.8))';
    if (props.$percentage >= 70) return 'rgba(255, 167, 38, 0.8)';
    return 'rgba(78, 205, 196, 0.8)';
  }};
  transition: all 0.3s ease;
  border-radius: 3px;
  ${props => props.$isProcessing && css`animation: ${pulse} 1.5s infinite;`}
`

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const ActionButton = styled.button`
  background: rgba(187, 134, 252, 0.2);
  border: 1px solid rgba(187, 134, 252, 0.4);
  color: rgba(187, 134, 252, 0.9);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.7rem;
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

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  
  &::before {
    content: '${props => props.$icon || '●'}';
    color: ${props => {
      if (props.$status === 'condensing') return 'rgba(255, 167, 38, 0.9)';
      if (props.$status === 'active') return 'rgba(78, 205, 196, 0.9)';
      if (props.$status === 'warning') return 'rgba(255, 167, 38, 0.9)';
      return 'rgba(255, 255, 255, 0.5)';
    }};
    ${props => props.$status === 'condensing' && css`animation: ${pulse} 1s infinite;`}
  }
`

function ContextVisualization({ sessionId = "default", onAction, isVisible = true, defaultExpanded = false }) {
  const [contextStats, setContextStats] = useState(null)
  const [sessionMemory, setSessionMemory] = useState(null)
  const [contextConfig, setContextConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  useEffect(() => {
    if (isVisible) {
      fetchContextData()
      const interval = setInterval(fetchContextData, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [sessionId, isVisible])

  const fetchContextData = async () => {
    try {
      const [statsResponse, memoryResponse, configResponse] = await Promise.all([
        fetch(`/api/context/stats/${sessionId}`),
        fetch(`/api/context/memory/${sessionId}`),
        fetch(`/api/context/config`)
      ])

      if (statsResponse.ok && memoryResponse.ok) {
        const stats = await statsResponse.json()
        const memory = await memoryResponse.json()
        setContextStats(stats)
        setSessionMemory(memory)
      }

      if (configResponse.ok) {
        const config = await configResponse.json()
        setContextConfig(config)
      }
    } catch (error) {
      console.error('[CONTEXT] Failed to fetch context data:', error)
    }
  }

  const handleForceCondensation = async () => {
    setIsLoading(true)
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
        await fetchContextData()
        onAction?.('condensation_completed')
      }
    } catch (error) {
      console.error('[CONTEXT] Condensation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSession = async () => {
    if (confirm('Clear all context for this session?')) {
      try {
        const response = await fetch(`/api/context/${sessionId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await fetchContextData()
          onAction?.('session_cleared')
        }
      } catch (error) {
        console.error('[CONTEXT] Failed to clear session:', error)
      }
    }
  }

  if (!isVisible || !contextStats) {
    return null
  }

  const tokenPercentage = contextStats.usage_percentage || 0
  const isCondensing = isLoading || contextStats.needs_condensation

  // Render compact view by default
  if (!isExpanded) {
    return (
      <Container $compact>
        <CompactContainer>
          <CompactLeft>
            <ContextLabel>Context:</ContextLabel>
            <ContextPercent $percentage={tokenPercentage}>
              {Math.round(tokenPercentage)}%
            </ContextPercent>
            <CompactTokenBar>
              <CompactTokenFill 
                $percentage={tokenPercentage} 
                $isProcessing={isCondensing}
              />
            </CompactTokenBar>
            {isCondensing && (
              <CondensingAlert>
                Condensing...
              </CondensingAlert>
            )}
          </CompactLeft>
          
          <CompactRight>
            <CompactClearButton onClick={handleClearSession}>
              Clear
            </CompactClearButton>
            <ExpandButton onClick={() => setIsExpanded(true)}>
              🧠 Details
            </ExpandButton>
          </CompactRight>
        </CompactContainer>
      </Container>
    )
  }

  // Render expanded view when requested
  return (
    <Container>
      <Header>
        <Title onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
          🧠 Context Intelligence {isExpanded ? '▼' : '▶'}
        </Title>
        <StatusIndicator 
          $status={isCondensing ? 'condensing' : 'active'} 
          $icon={isCondensing ? '⚡' : '●'}
        >
          {isCondensing ? 'Processing...' : 'Smart Mode Active'}
        </StatusIndicator>
      </Header>

      <TokenBar>
        <TokenFill 
          $percentage={tokenPercentage} 
          $isProcessing={isCondensing}
        />
      </TokenBar>

      <ContextMetrics>
        <Metric>
          <MetricValue $type={tokenPercentage >= 90 ? 'danger' : tokenPercentage >= 70 ? 'warning' : 'success'}>
            {Math.round(tokenPercentage)}%
          </MetricValue>
          <MetricLabel>Context Usage</MetricLabel>
        </Metric>
        
        <Metric>
          <MetricValue>{contextStats.total_messages || 0}</MetricValue>
          <MetricLabel>Messages</MetricLabel>
        </Metric>
        
        <Metric>
          <MetricValue>{contextStats.context_chunks || 0}</MetricValue>
          <MetricLabel>Memory Chunks</MetricLabel>
        </Metric>
        
        <Metric>
          <MetricValue>{contextStats.condensation_count || 0}</MetricValue>
          <MetricLabel>Condensations</MetricLabel>
        </Metric>
      </ContextMetrics>

      {isExpanded && sessionMemory && (
        <MemoryLanes>
          <MemoryLane $color="rgba(78, 205, 196, 0.6)">
            <LaneTitle $color="rgba(78, 205, 196, 0.9)">Summary</LaneTitle>
            <LaneContent>
              {sessionMemory.rolling_summary || 'No summary yet'}
            </LaneContent>
          </MemoryLane>

          <MemoryLane $color="rgba(255, 167, 38, 0.6)">
            <LaneTitle $color="rgba(255, 167, 38, 0.9)">Constraints</LaneTitle>
            <LaneContent>
              {sessionMemory.constraints_decisions?.length > 0 
                ? sessionMemory.constraints_decisions.slice(-3).map((item, i) => (
                    <div key={i} style={{ marginBottom: '0.25rem' }}>• {item}</div>
                  ))
                : 'No constraints set'
              }
            </LaneContent>
          </MemoryLane>

          <MemoryLane $color="rgba(187, 134, 252, 0.6)">
            <LaneTitle $color="rgba(187, 134, 252, 0.9)">Current Topic</LaneTitle>
            <LaneContent>
              {sessionMemory.current_topic || 'General conversation'}
            </LaneContent>
          </MemoryLane>

          <MemoryLane $color="rgba(255, 107, 107, 0.6)">
            <LaneTitle $color="rgba(255, 107, 107, 0.9)">Facts</LaneTitle>
            <LaneContent>
              {Object.keys(sessionMemory.canonical_facts || {}).length > 0
                ? Object.entries(sessionMemory.canonical_facts).slice(-2).map(([key, value], i) => (
                    <div key={i} style={{ marginBottom: '0.25rem' }}>
                      <strong>{key}:</strong> {value}
                    </div>
                  ))
                : 'No facts stored'
              }
            </LaneContent>
          </MemoryLane>

          {contextConfig && (
            <MemoryLane $color="rgba(255, 255, 255, 0.6)">
              <LaneTitle $color="rgba(255, 255, 255, 0.9)">Configuration</LaneTitle>
              <LaneContent>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Max Tokens:</strong> {contextConfig.max_tokens?.toLocaleString()}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Available:</strong> {contextConfig.available_tokens?.toLocaleString()}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Condense at:</strong> {Math.round(contextConfig.condensation_threshold * 100)}%
                </div>
                <div>
                  <strong>Recent Window:</strong> {contextConfig.recent_window_size} msgs
                </div>
              </LaneContent>
            </MemoryLane>
          )}
        </MemoryLanes>
      )}

      <ActionButtons>
        <ActionButton 
          onClick={handleForceCondensation}
          disabled={isLoading || contextStats.total_messages < 3}
        >
          {isLoading ? 'Condensing...' : 'Force Condense'}
        </ActionButton>
        
        <ActionButton onClick={handleClearSession}>
          Clear Session
        </ActionButton>
        
        <ActionButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'} View
        </ActionButton>
      </ActionButtons>
    </Container>
  )
}

export default ContextVisualization