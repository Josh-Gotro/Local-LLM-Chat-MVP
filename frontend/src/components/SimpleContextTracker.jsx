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
  padding: 0.4rem 0;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  gap: 0.75rem;
  flex-wrap: wrap;
  text-align: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
    font-size: 0.65rem;
    padding: 0.3rem 0;
  }
`

const ContextSection = styled.div`
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
  font-weight: 500;
  color: ${props => {
    if (props.$percentage >= 90) return 'rgba(255, 107, 107, 0.8)';
    if (props.$percentage >= 70) return 'rgba(255, 167, 38, 0.8)';
    return 'rgba(78, 205, 196, 0.8)';
  }};
  min-width: 30px;
  text-align: right;
`

const TokenBar = styled.div`
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

const TokenFill = styled.div`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: ${props => {
    if (props.$isCondensing) return 'linear-gradient(90deg, rgba(255, 167, 38, 0.9), rgba(255, 107, 107, 0.9))';
    if (props.$percentage >= 90) return 'rgba(255, 107, 107, 0.8)';
    if (props.$percentage >= 70) return 'rgba(255, 167, 38, 0.8)';
    return 'rgba(78, 205, 196, 0.8)';
  }};
  transition: all 0.3s ease;
  border-radius: 2px;
  ${props => props.$isCondensing && css`animation: ${pulse} 1.5s infinite;`}
`

const CondensingAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6rem;
  color: rgba(255, 167, 38, 0.8);
  animation: ${pulse} 1.5s infinite;

  &::before {
    content: '⚡';
  }
`

const ClearButton = styled.button`
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

function SimpleContextTracker({ 
  contextInfo, 
  onClearConversation,
  isVisible = true 
}) {
  if (!isVisible || !contextInfo) return null

  const percentage = contextInfo.percentage || 0
  const isCondensing = contextInfo.isSummarizing || contextInfo.needsCondensing

  return (
    <Container>
      <ContextSection>
        <ContextLabel>Context:</ContextLabel>
        <ContextPercent $percentage={percentage}>
          {Math.round(percentage)}%
        </ContextPercent>
        <TokenBar>
          <TokenFill 
            $percentage={percentage} 
            $isCondensing={isCondensing}
          />
        </TokenBar>
        <span>{contextInfo.messageCount || 0} msgs</span>
      </ContextSection>

      {isCondensing && (
        <CondensingAlert>
          {contextInfo.isSummarizing ? 'Condensing...' : 'Will condense'}
        </CondensingAlert>
      )}

      {contextInfo.hasBeenCondensed && (
        <ContextSection>
          <span style={{ color: 'rgba(78, 205, 196, 0.8)', fontSize: '0.6rem' }}>
            ✓ Enhanced
          </span>
        </ContextSection>
      )}

      <ContextSection>
        <ClearButton onClick={onClearConversation}>
          Clear
        </ClearButton>
      </ContextSection>
    </Container>
  )
}

export default SimpleContextTracker