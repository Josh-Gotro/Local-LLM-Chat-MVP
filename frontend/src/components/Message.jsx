import styled from 'styled-components'

const MessageContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  word-wrap: break-word;

  ${props => props.$role === 'user' && `
    background-color: #2563eb;
    margin-left: 2rem;
    
    @media (max-width: 768px) {
      margin-left: 1rem;
    }
    
    @media (prefers-color-scheme: light) {
      background-color: #3b82f6;
      color: white;
    }
  `}

  ${props => props.$role === 'assistant' && `
    background-color: #374151;
    margin-right: 2rem;
    
    @media (max-width: 768px) {
      margin-right: 1rem;
    }
    
    @media (prefers-color-scheme: light) {
      background-color: #e5e7eb;
      color: #374151;
    }
  `}

  ${props => props.$role === 'error' && `
    background-color: #dc2626;
    margin-right: 2rem;
    
    @media (max-width: 768px) {
      margin-right: 1rem;
    }
    
    @media (prefers-color-scheme: light) {
      background-color: #ef4444;
      color: white;
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