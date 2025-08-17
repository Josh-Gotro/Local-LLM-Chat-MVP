import { useState, useEffect } from 'react'
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
  const [conversationSummary, setConversationSummary] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [forceContextUpdate, setForceContextUpdate] = useState(0)

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, id: Date.now() }])
  }

  const clearConversation = () => {
    setMessages([])
    setThinkingContent('')
    setShowThinking(false)
    setIsLoading(false)
    setConversationSummary('')
    console.log('[DEBUG] Conversation cleared')
  }

  const summarizeConversation = async (messagesToSummarize) => {
    try {
      setIsSummarizing(true)
      console.log('[DEBUG] Starting conversation summarization...')
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:latest',
          messages: messagesToSummarize
        })
      })

      if (!response.ok) {
        throw new Error(`Summarization failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('[DEBUG] Conversation summarized successfully')
      return result.summary
    } catch (error) {
      console.error('[DEBUG] Summarization error:', error)
      // Fallback: create a simple summary
      return "Previous conversation context has been preserved."
    } finally {
      setIsSummarizing(false)
    }
  }

  const buildConversationHistory = async () => {
    // Convert UI messages to LLM format, filtering out search results
    const conversationMessages = messages
      .filter(msg => msg.role !== 'search') // Exclude search result messages
      .map(msg => ({
        role: msg.role === 'error' ? 'assistant' : msg.role, // Convert errors to assistant messages
        content: msg.role === 'user' && msg.content.startsWith('🔍 ') 
          ? msg.content.substring(2) // Remove search icon from user messages
          : msg.content
      }))
    
    // More reasonable context management with larger window
    const MAX_RECENT_MESSAGES = 10  // Keep more recent messages
    const MAX_TOKENS = 32000  // Much larger context window
    
    // Rough token estimation (very approximate: 1 token ≈ 4 characters)
    const estimateTokens = (text) => Math.ceil(text.length / 4)
    const summaryTokens = conversationSummary ? estimateTokens(conversationSummary) : 0
    
    // FIXED: Check total context size first, not just recent messages
    const allMessageTokens = conversationMessages.reduce((total, msg) => 
      total + estimateTokens(msg.content), 0)
    const totalContextTokens = allMessageTokens + summaryTokens
    
    console.log(`[DEBUG] Conversation: ${conversationMessages.length} total messages`)
    console.log(`[DEBUG] Tokens: ${allMessageTokens} all messages + ${summaryTokens} summary = ${totalContextTokens}/${MAX_TOKENS}`)
    
    // Check if we need condensation based on TOTAL context, not just recent
    const needsCondensation = totalContextTokens >= MAX_TOKENS
    
    console.log(`[DEBUG] Tokens: ${totalContextTokens}/${MAX_TOKENS}, needsCondensation: ${needsCondensation}, hasExistingSummary: ${!!conversationSummary}`)
    
    // Trigger condensation when over token limit (works for both first time and ongoing)
    if (needsCondensation && conversationMessages.length > 15) {  // Allow more messages before condensing
      console.log('[DEBUG] Context over limit - condensing...')
      
      // Keep more recent messages for better context continuity
      const keepRecentCount = Math.min(MAX_RECENT_MESSAGES, Math.max(5, conversationMessages.length - 20))  // More reasonable
      const messagesToKeep = conversationMessages.slice(-keepRecentCount)
      const messagesToSummarize = conversationMessages.slice(0, -keepRecentCount)
      
      console.log(`[DEBUG] Keeping ${keepRecentCount} recent messages, summarizing ${messagesToSummarize.length} older messages`)
      
      // CRITICAL: Update UI state BEFORE summarization to immediately reflect fewer messages
      const searchMessages = messages.filter(msg => msg.role === 'search')
      const keepUIMessages = messagesToKeep.map(msg => {
        return messages.find(uiMsg => uiMsg.content === msg.content && uiMsg.role === msg.role) || 
               { ...msg, id: Date.now() + Math.random() }
      })
      setMessages([...searchMessages, ...keepUIMessages])
      
      // Create or update summary (happens after UI update)
      const newSummary = await summarizeConversation(messagesToSummarize)
      setConversationSummary(newSummary)
      
      console.log('[DEBUG] Context condensation completed')
      
      return [
        { role: 'system', content: `Previous conversation context: ${newSummary}` },
        ...messagesToKeep
      ]
    }
    
    // For non-condensation case, still limit to recent messages for performance
    const recentMessages = conversationMessages.slice(-MAX_RECENT_MESSAGES)
    
    // If we have a summary, include it as system context
    if (conversationSummary) {
      return [
        { role: 'system', content: `Previous conversation context: ${conversationSummary}` },
        ...recentMessages
      ]
    }
    
    return recentMessages
  }

  // Calculate context info for the visual indicator  
  const getContextInfo = () => {
    const conversationMessages = messages.filter(msg => msg.role !== 'search')
    const MAX_TOKENS = 32000  // Match the new larger context window
    const estimateTokens = (text) => Math.ceil(text.length / 4)
    
    // FIXED: Use same logic as buildConversationHistory for consistency
    // This ensures the visual indicator matches the actual condensation trigger
    const summaryTokens = conversationSummary ? estimateTokens(conversationSummary) : 0
    const allMessageTokens = conversationMessages.reduce((total, msg) => 
      total + estimateTokens(msg.content), 0)
    const totalTokens = allMessageTokens + summaryTokens
    
    // Add debug logging to track context calculation
    console.log(`[CONTEXT] Messages: ${conversationMessages.length}, MessageTokens: ${allMessageTokens}, SummaryTokens: ${summaryTokens}, Total: ${totalTokens}, ForceUpdate: ${forceContextUpdate}`)
    
    return {
      tokensUsed: totalTokens,
      maxTokens: MAX_TOKENS,
      percentage: (totalTokens / MAX_TOKENS) * 100,
      messageCount: conversationMessages.length,
      isSummarizing: isSummarizing,
      needsCondensing: totalTokens >= MAX_TOKENS,
      hasBeenCondensed: !!conversationSummary
    }
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
      // Build conversation history including the new user message
      // This will automatically trigger condensation if needed
      const conversationHistory = [
        ...(await buildConversationHistory()),
        { role: 'user', content: text }
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:latest',
          messages: conversationHistory
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
      <MessageInput 
        onSendMessage={sendMessage} 
        onSearchMessage={searchMessage} 
        isLoading={isLoading}
        contextInfo={getContextInfo()}
        onClearConversation={clearConversation}
        sessionId="default"
        useEnhancedContext={false} // Keep legacy mode for backward compatibility
      />
    </Container>
  )
}

export default ChatContainer