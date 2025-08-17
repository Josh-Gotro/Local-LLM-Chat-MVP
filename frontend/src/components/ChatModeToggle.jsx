import { useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 768px) {
    top: 0.5rem;
    left: 0.5rem;
  }
`

const ToggleButton = styled.button`
  background: rgba(187, 134, 252, 0.2);
  border: 1px solid rgba(187, 134, 252, 0.4);
  color: rgba(187, 134, 252, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(187, 134, 252, 0.3);
    border-color: rgba(187, 134, 252, 0.6);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`

const ModeIndicator = styled.div`
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.7rem;
  color: ${props => props.$enhanced ? 'rgba(78, 205, 196, 0.9)' : 'rgba(255, 255, 255, 0.7)'};
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.6rem;
    padding: 0.25rem 0.5rem;
  }
`

function ChatModeToggle({ isEnhanced, onToggle }) {
  return (
    <Container>
      <ToggleButton onClick={onToggle}>
        {isEnhanced ? '← Basic Mode' : '🧠 Enhanced Mode'}
      </ToggleButton>
      <ModeIndicator $enhanced={isEnhanced}>
        {isEnhanced ? '🧠 Enhanced' : '⚡ Basic'}
      </ModeIndicator>
    </Container>
  )
}

export default ChatModeToggle