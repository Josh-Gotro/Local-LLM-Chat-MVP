import { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'

const Form = styled.form`
  border-top: 1px solid rgba(187, 134, 252, 0.3);
  padding-top: 1rem;

  @media (prefers-color-scheme: light) {
    border-top-color: rgba(187, 134, 252, 0.3);
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
  onClearConversation
}) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSearchMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }


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
    </Form>
  )
}

export default EnhancedMessageInput