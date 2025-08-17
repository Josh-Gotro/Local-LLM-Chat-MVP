import { useState, useEffect } from 'react'
import styled from 'styled-components'
import MessageList from './MessageList'
import EnhancedMessageInput from './EnhancedMessageInput'
import ThinkingBubble from './ThinkingBubble'
import SearchResults from './SearchResults'
import ContextVisualization from './ContextVisualization'

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


function EnhancedChatContainer() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')
  const [showThinking, setShowThinking] = useState(false)
  const [sessionId] = useState("default") // In future, could be user-specific
  const [contextStats, setContextStats] = useState(null)

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory()
  }, [sessionId])

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/context/history/${sessionId}?limit=20`)
      if (response.ok) {
        const history = await response.json()
        const uiMessages = history.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          id: msg.id || Date.now() + Math.random()
        }))
        setMessages(uiMessages)
      }
    } catch (error) {
      console.error('[CONTEXT] Failed to load conversation history:', error)
    }
  }

  const addMessage = (role, content) => {
    const newMessage = { role, content, id: Date.now() + Math.random() }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }

  const clearConversation = async () => {
    try {
      // Clear context on backend
      await fetch(`/api/context/${sessionId}`, { method: 'DELETE' })
      
      // Clear UI state
      setMessages([])
      setThinkingContent('')
      setShowThinking(false)
      setIsLoading(false)
      
      console.log('[ENHANCED] Conversation and context cleared')
    } catch (error) {
      console.error('[ENHANCED] Failed to clear context:', error)
      // Fallback to UI-only clear
      setMessages([])
      setThinkingContent('')
      setShowThinking(false)
      setIsLoading(false)
    }
  }

  const fetchContextStats = async () => {
    try {
      const response = await fetch(`/api/context/stats/${sessionId}`)
      if (response.ok) {
        const stats = await response.json()
        setContextStats(stats)
        return stats
      }
    } catch (error) {
      console.error('[CONTEXT] Failed to fetch stats:', error)
    }
    return null
  }

  const searchMessage = async (text) => {
    if (!text.trim()) return

    addMessage('user', `🔍 ${text}`)
    setIsLoading(true)
    setThinkingContent('')
    setShowThinking(false)

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
            
            if (data.search_results) {
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
                
                // Add to context backend
                await fetch('/api/context/add-message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    session_id: sessionId,
                    role: 'assistant',
                    content: finalMessage
                  })
                })
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

    // Check for search command
    const searchMatch = text.match(/^\/search\s+(.+)$/i)
    if (searchMatch) {
      const query = searchMatch[1].trim()
      return searchMessage(query)
    }

    // Add user message to UI
    addMessage('user', text)
    setIsLoading(true)
    setThinkingContent('')
    setShowThinking(false)

    const thinkingDelay = setTimeout(() => {
      setShowThinking(true)
    }, 800)

    try {
      // Use enhanced chat endpoint with context management
      const response = await fetch('/api/context/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:latest',
          messages: [{ role: 'user', content: text }],
          session_id: sessionId
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
              
              // Refresh context stats after conversation
              await fetchContextStats()
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

  const handleContextAction = (action) => {
    console.log('[CONTEXT] Action:', action)
    
    if (action === 'session_cleared') {
      setMessages([])
    }
    
    if (action === 'condensation_completed') {
      // Optionally refresh message list or show notification
      fetchContextStats()
    }
  }

  // Simple context info for backward compatibility
  const getContextInfo = () => {
    if (!contextStats) {
      return {
        tokensUsed: 0,
        maxTokens: 32000,  // Updated default
        percentage: 0,
        messageCount: messages.length,
        isSummarizing: false,
        needsCondensing: false,
        hasBeenCondensed: false
      }
    }

    return {
      tokensUsed: contextStats.token_breakdown?.total || 0,
      maxTokens: contextStats.max_tokens || 32000,
      percentage: contextStats.usage_percentage || 0,
      messageCount: contextStats.total_messages || 0,
      isSummarizing: false,
      needsCondensing: contextStats.needs_condensation || false,
      hasBeenCondensed: contextStats.condensation_count > 0
    }
  }

  // Fetch context stats periodically
  useEffect(() => {
    fetchContextStats()
    const interval = setInterval(fetchContextStats, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [sessionId])

  return (
    <Container>
      <MessageList 
        messages={messages} 
        isLoading={isLoading && showThinking} 
        thinkingContent={thinkingContent}
      />
      
      <EnhancedMessageInput 
        onSendMessage={sendMessage} 
        onSearchMessage={searchMessage} 
        isLoading={isLoading}
        sessionId={sessionId}
        onClearConversation={clearConversation}
      />

      <ContextVisualization
        sessionId={sessionId}
        onAction={handleContextAction}
        isVisible={true}
        defaultExpanded={false}
      />
    </Container>
  )
}

export default EnhancedChatContainer