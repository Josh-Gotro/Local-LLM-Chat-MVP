import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import Message from './Message'
import ThinkingBubble from './ThinkingBubble'

const Container = styled.div`
  flex: 1;
  border: 1px solid rgba(187, 134, 252, 0.3);
  border-radius: 12px;
  padding: 1rem;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  min-height: 300px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.3);

  /* Custom scrollbar for synthwave theme */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #ff4081, #bb86fc);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #ff6b9d, #d1a3ff);
  }

  @media (max-width: 768px) {
    min-height: 250px;
    padding: 0.75rem;
    border-radius: 8px;
  }

  @media (min-width: 1025px) {
    min-height: 400px;
    padding: 1.5rem;
  }

  @media (prefers-color-scheme: light) {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    border-color: rgba(187, 134, 252, 0.3);
  }
`

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-style: italic;

  @media (prefers-color-scheme: light) {
    color: #6b7280;
  }
`

function MessageList({ messages, isLoading, thinkingContent }) {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, thinkingContent])

  return (
    <Container>
      {messages.length === 0 ? (
        <EmptyState>
          <p>Start a conversation with your local LLM!</p>
        </EmptyState>
      ) : (
        messages.map((message) => (
          <Message 
            key={message.id} 
            role={message.role} 
            content={message.content} 
          />
        ))
      )}
      {isLoading && <ThinkingBubble thinkingContent={thinkingContent} />}
      <div ref={messagesEndRef} />
    </Container>
  )
}

export default MessageList