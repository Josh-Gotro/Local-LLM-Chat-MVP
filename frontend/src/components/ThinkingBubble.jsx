import styled, { keyframes } from 'styled-components'

const thinking = keyframes`
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
`

const ThinkingContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  word-wrap: break-word;
  background: transparent;
  border: 2px dashed #b8860b;
  margin-right: 2rem;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.9);
  animation: thinking-glow 2s ease-in-out infinite;

  @keyframes thinking-glow {
    0%, 100% { 
      border-color: #b8860b;
      box-shadow: 0 0 5px rgba(184, 134, 11, 0.3);
    }
    50% { 
      border-color: #daa520;
      box-shadow: 0 0 15px rgba(218, 165, 32, 0.5);
    }
  }

  @media (max-width: 768px) {
    margin-right: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem;
  }

  @media (prefers-color-scheme: light) {
    border-color: #daa520;
    color: rgba(255, 255, 255, 0.95);
    
    @keyframes thinking-glow {
      0%, 100% { 
        border-color: #daa520;
        box-shadow: 0 0 5px rgba(218, 165, 32, 0.4);
      }
      50% { 
        border-color: #b8860b;
        box-shadow: 0 0 15px rgba(184, 134, 11, 0.6);
      }
    }
  }
`

const MessageHeader = styled.div`
  margin-bottom: 0.5rem;
`

const MessageRole = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  opacity: 0.8;
`

const MessageContent = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
`

const ThinkingText = styled.span`
  font-style: italic;
  opacity: 0.7;
`

const ThinkingDots = styled.span`
  margin-left: 0.25rem;
`

const Dot = styled.span`
  animation: ${thinking} 1.4s infinite ease-in-out;
  font-weight: bold;
  font-size: 1.2em;

  &:nth-child(1) {
    animation-delay: 0s;
  }

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`

const ThinkingContentDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ThinkingLabel = styled.div`
  font-style: italic;
  opacity: 0.7;
  font-size: 0.9em;
  color: #888;

  @media (prefers-color-scheme: light) {
    color: #6b7280;
  }
`

const ThinkingTextContent = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  white-space: pre-wrap;
  line-height: 1.4;
  border-left: 3px solid #646cff;
  margin-left: 0.5rem;

  @media (prefers-color-scheme: light) {
    background-color: rgba(0, 0, 0, 0.05);
    border-left-color: #3b82f6;
  }
`

function ThinkingBubble({ thinkingContent }) {
  return (
    <ThinkingContainer>
      <MessageHeader>
        <MessageRole>Assistant</MessageRole>
      </MessageHeader>
      <MessageContent>
        {thinkingContent ? (
          <ThinkingContentDiv>
            <ThinkingLabel>thinking:</ThinkingLabel>
            <ThinkingTextContent>{thinkingContent}</ThinkingTextContent>
          </ThinkingContentDiv>
        ) : (
          <>
            <ThinkingText>thinking</ThinkingText>
            <ThinkingDots>
              <Dot>.</Dot>
              <Dot>.</Dot>
              <Dot>.</Dot>
            </ThinkingDots>
          </>
        )}
      </MessageContent>
    </ThinkingContainer>
  )
}

export default ThinkingBubble