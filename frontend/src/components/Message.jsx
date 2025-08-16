import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

  /* Markdown styling */
  h1, h2, h3, h4, h5, h6 {
    margin: 0.5rem 0;
    color: rgba(255, 255, 255, 0.95);
  }

  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.3rem; }
  h3 { font-size: 1.1rem; }

  p {
    margin: 0.5rem 0;
  }

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.75rem;
    border-radius: 6px;
    margin: 0.5rem 0;
    overflow-x: auto;
    border-left: 3px solid rgba(255, 255, 255, 0.3);
  }

  pre code {
    background: none;
    padding: 0;
  }

  ul, ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.25rem 0;
  }

  blockquote {
    border-left: 3px solid rgba(255, 255, 255, 0.3);
    padding-left: 0.75rem;
    margin: 0.5rem 0;
    font-style: italic;
    opacity: 0.9;
  }

  strong {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.98);
  }

  em {
    font-style: italic;
    color: rgba(255, 255, 255, 0.9);
  }

  a {
    color: #bb86fc;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
      color: #d1a3ff;
    }
  }

  table {
    border-collapse: collapse;
    margin: 0.5rem 0;
    width: 100%;
  }

  th, td {
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.5rem;
    text-align: left;
  }

  th {
    background: rgba(255, 255, 255, 0.1);
    font-weight: 600;
  }
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
        {role === 'assistant' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        ) : (
          content
        )}
      </MessageContent>
    </MessageContainer>
  )
}

export default Message