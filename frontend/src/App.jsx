import styled, { createGlobalStyle } from 'styled-components'
import ChatContainer from './components/ChatContainer'

const AppContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  color: rgba(255, 255, 255, 0.95);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;

  /* Mobile: 320px - 768px */
  @media (max-width: 768px) {
    width: calc(100% - 1rem);
    max-width: none;
    margin: 0.5rem auto;
    padding: 0.75rem;
    height: calc(100vh - 1rem);
    border-radius: 15px;
  }

  /* Tablet: 769px - 1024px */
  @media (min-width: 769px) and (max-width: 1024px) {
    width: 95%;
    max-width: 900px;
    margin: 1rem auto;
    padding: 1.25rem;
    height: calc(100vh - 2rem);
  }

  /* Desktop: 1025px - 1399px */
  @media (min-width: 1025px) and (max-width: 1399px) {
    width: 90%;
    max-width: 1200px;
    margin: 1.5rem auto;
    padding: 2rem;
    height: calc(100vh - 3rem);
  }

  /* Large Desktop: 1400px+ */
  @media (min-width: 1400px) {
    width: 85%;
    max-width: 1400px;
    margin: 2rem auto;
    padding: 2.5rem;
    height: calc(100vh - 4rem);
  }

  @media (prefers-color-scheme: light) {
    color: rgba(255, 255, 255, 0.95);
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
  }
`

const Title = styled.h1`
  text-align: center;
  margin: 1rem 0;
  font-size: 2rem;
  background: linear-gradient(45deg, #8b7355, #b8860b, #f5f5f5, #000000);
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: synthwave-glow 8s ease-in-out infinite;
  text-shadow: 
    0 0 10px rgba(139, 115, 85, 0.5),
    0 0 20px rgba(184, 134, 11, 0.3),
    0 0 30px rgba(245, 245, 245, 0.2);
  font-weight: 700;
  letter-spacing: 2px;

  @keyframes synthwave-glow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin: 0.5rem 0;
    letter-spacing: 1px;
  }

  @media (prefers-color-scheme: light) {
    background: linear-gradient(45deg, #8b7355, #b8860b, #f5f5f5, #000000);
    background-size: 300% 300%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: linear-gradient(135deg, 
      #000000 0%, 
      #1a1a1a 15%, 
      #2d2d2d 25%, 
      #8b7355 40%, 
      #b8860b 50%, 
      #daa520 60%, 
      #f5f5f5 75%, 
      #e8e8e8 85%, 
      #000000 100%
    ) !important;
    background-attachment: fixed !important;
  }

  body {
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Add subtle animated overlay for extra synthwave effect */
  #root::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(187, 134, 252, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 64, 129, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 70%, rgba(50, 130, 184, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
`

function App() {
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Title>Chat</Title>
        <ChatContainer />
      </AppContainer>
    </>
  )
}

export default App