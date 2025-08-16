import styled from 'styled-components'

const MessageContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  word-wrap: break-word;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);

  ${props => props.$role === 'user' && `
    border: 2px solid #b8860b;
    margin-left: 2rem;
    
    @media (max-width: 768px) {
      margin-left: 1rem;
    }
    
    @media (prefers-color-scheme: light) {
      border-color: #daa520;
      color: rgba(255, 255, 255, 0.95);
    }
  `}

  ${props => props.$role === 'assistant' && `
    border: 2px solid #f5f5f5;
    margin-right: 2rem;
    
    @media (max-width: 768px) {
      margin-right: 1rem;
    }
    
    @media (prefers-color-scheme: light) {
      border-color: #e8e8e8;
      color: rgba(255, 255, 255, 0.95);
    }
  `}

  ${props => props.$role === 'error' && `
    border: 2px solid #dc2626;
    background: rgba(220, 38, 38, 0.1);
    margin-right: 2rem;
    
    @media (max-width: 768px) {
      margin-right: 1rem;
    }
    
    @media (prefers-color-scheme: light) {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      color: rgba(255, 255, 255, 0.95);
    }
  `}

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 0.5rem;
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

function Message({ role, content }) {
  const getMessageLabel = () => {
    switch (role) {
      case 'user':
        return 'You'
      case 'assistant':
        return 'Assistant'
      case 'error':
        return 'Error'
      default:
        return role
    }
  }

  return (
    <MessageContainer $role={role}>
      <MessageHeader>
        <MessageRole>{getMessageLabel()}</MessageRole>
      </MessageHeader>
      <MessageContent>
        {content}
      </MessageContent>
    </MessageContainer>
  )
}

export default Message