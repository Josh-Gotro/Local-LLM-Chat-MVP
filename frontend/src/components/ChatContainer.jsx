import { useState } from 'react'
import styled from 'styled-components'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ThinkingBubble from './ThinkingBubble'
import SearchResults from './SearchResults'

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }

  @media (min-width: 1025px) {
    gap: 1.5rem;
  }
`

function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')
  const [showThinking, setShowThinking] = useState(false)

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, id: Date.now() }])
  }


  const searchMessage = async (text) => {
    if (!text.trim()) return

    addMessage('user', `🔍 ${text}`)
    setIsLoading(true)
    setThinkingContent('')
    setShowThinking(false)

    // Add a natural delay before showing thinking bubble
    const thinkingDelay = setTimeout(() => {
      setShowThinking(true)
    }, 800)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          model: 'qwen3:latest',
          max_results: 2
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalMessage = ''
      let isInThinking = false
      let currentThinking = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)
            
            // Handle search results
            if (data.search_results) {
              // Add search results as a special message
              addMessage('search', JSON.stringify({
                query: data.query,
                results: data.search_results,
                count: data.search_results.length
              }))
              continue
            }
            
            if (data.message?.content) {
              const content = data.message.content
              
              if (content.includes('<think>')) {
                isInThinking = true
                currentThinking = content.split('<think>')[1] || ''
              }
              else if (content.includes('</think>')) {
                isInThinking = false
                currentThinking += content.split('</think>')[0] || ''
                setThinkingContent(currentThinking)
                currentThinking = ''
              }
              else if (isInThinking) {
                currentThinking += content
                setThinkingContent(currentThinking)
              }
              else if (!isInThinking && !content.includes('<think>')) {
                finalMessage += content
              }
            }

            if (data.done) {
              clearTimeout(thinkingDelay)
              setIsLoading(false)
              setThinkingContent('')
              setShowThinking(false)
              if (finalMessage) {
                addMessage('assistant', finalMessage)
              } else {
                addMessage('assistant', '(no response)')
              }
              break
            }
          } catch (e) {
            continue
          }
        }
      }
    } catch (error) {
      clearTimeout(thinkingDelay)
      addMessage('error', error.message)
      setIsLoading(false)
      setThinkingContent('')
      setShowThinking(false)
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return

    // Check if this is a search command
    const searchMatch = text.match(/^\/search\s+(.+)$/i)
    if (searchMatch) {
      const query = searchMatch[1].trim()
      return searchMessage(query)
    }

    // Add user message
    addMessage('user', text)
    setIsLoading(true)
    setThinkingContent('')
    setShowThinking(false)

    // Add a natural delay before showing thinking bubble
    const thinkingDelay = setTimeout(() => {
      setShowThinking(true)
    }, 800) // 800ms delay feels natural

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:latest',
          messages: [{ role: 'user', content: text }]
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalMessage = ''
      let isInThinking = false
      let currentThinking = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)
            
            if (data.message?.content) {
              const content = data.message.content
              
              // Check if we're entering thinking mode
              if (content.includes('<think>')) {
                isInThinking = true
                currentThinking = content.split('<think>')[1] || ''
              }
              // Check if we're exiting thinking mode
              else if (content.includes('</think>')) {
                isInThinking = false
                currentThinking += content.split('</think>')[0] || ''
                setThinkingContent(currentThinking)
                currentThinking = ''
              }
              // If we're in thinking mode, accumulate thinking content
              else if (isInThinking) {
                currentThinking += content
                setThinkingContent(currentThinking)
              }
              // If we're not in thinking mode, this is the final answer
              else if (!isInThinking && !content.includes('<think>')) {
                finalMessage += content
              }
            }

            if (data.done) {
              clearTimeout(thinkingDelay)
              setIsLoading(false)
              setThinkingContent('')
              setShowThinking(false)
              if (finalMessage) {
                addMessage('assistant', finalMessage)
              } else {
                addMessage('assistant', '(no response)')
              }
              break
            }
          } catch (e) {
            // Skip malformed JSON lines
            continue
          }
        }
      }
    } catch (error) {
      clearTimeout(thinkingDelay)
      addMessage('error', error.message)
      setIsLoading(false)
      setThinkingContent('')
      setShowThinking(false)
    }
  }

  return (
    <Container>
      <MessageList 
        messages={messages} 
        isLoading={isLoading && showThinking} 
        thinkingContent={thinkingContent}
      />
      <MessageInput onSendMessage={sendMessage} onSearchMessage={searchMessage} isLoading={isLoading} />
    </Container>
  )
}

export default ChatContainer