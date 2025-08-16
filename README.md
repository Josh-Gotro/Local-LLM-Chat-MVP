# Local LLM Chat MVP

**Local LLM Chat MVP** is a lightweight chat application that serves as a proxy between a modern React frontend and the Ollama LLM engine. The app features both regular chat and intelligent web search capabilities, powered by LLM-based result filtering.

## 🏗️ Architecture

The application follows a simple proxy pattern with enhanced search capabilities:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | FastAPI + Python | • Proxies chat requests to Ollama<br>• Provides intelligent web search with LLM filtering<br>• Handles streaming responses | 
| **Frontend** | Vite + React + Styled Components | • Modern chat interface<br>• Real-time streaming with thinking bubbles<br>• Dual input modes: Chat and Search |

### Communication Flow
1. **Frontend** (localhost:5173) sends requests to **Backend** (localhost:8000)
2. **Backend** forwards chat requests to **Ollama** (localhost:11434) 
3. **Search requests** trigger web search + LLM analysis for result filtering
4. Responses stream back through the proxy unchanged

---

## 📦 Project Structure

```
Local-LLM-Chat-MVP/
├── backend/                    ← FastAPI Python server
│   ├── app.py                 ← Main API with chat & search endpoints
│   ├── search_service.py      ← DuckDuckGo search integration
│   ├── requirements.txt       ← Python dependencies
│   └── venv/                  ← Virtual environment (created on install)
├── frontend/                  ← Vite + React SPA
│   ├── src/
│   │   ├── components/        ← React components
│   │   │   ├── ChatContainer.jsx    ← Main chat logic & state
│   │   │   ├── MessageList.jsx      ← Message display & scrolling
│   │   │   ├── MessageInput.jsx     ← Dual-button input (Send/Search)
│   │   │   ├── Message.jsx          ← Individual message styling
│   │   │   ├── SearchResults.jsx    ← Search results display
│   │   │   └── ThinkingBubble.jsx   ← Live thinking visualization
│   │   ├── main.js            ← React app entry point
│   │   └── index.css          ← Global styles
│   ├── index.html
│   ├── vite.config.js         ← Vite config with API proxy
│   └── package.json           ← Frontend dependencies & scripts
├── CLAUDE.md                  ← Development instructions for Claude Code
└── README.md                  ← This file
```

---

## ✨ Features

### 💬 **Chat Interface**
- **Streaming responses** with real-time typing effect
- **Thinking visualization** - see the LLM's reasoning process in `<think>` tags
- **Responsive design** - mobile-friendly layout that adapts to screen size
- **Modern UI** with styled-components and luxury theme

### 🔍 **Intelligent Web Search**
- **Dual input modes**: 
  - 🦆🦆→ **Search button** (matte gold) - performs web search
  - **Send button** (gradient) - regular chat
- **LLM-powered result filtering** - automatically selects the 2 most relevant results
- **Integrated display** - search results appear above AI response in proper order
- **DuckDuckGo integration** with fallback search methods

### 🧠 **Search Intelligence**
1. **Fetches 4-6 results** from DuckDuckGo initially
2. **LLM analysis** ranks results by relevance to user query
3. **Smart selection** of top 2 most useful results
4. **Graceful fallback** to first results if filtering fails

---

## ⚙️ Prerequisites

| Requirement | Installation |
|-------------|--------------|
| **Python 3.8+** | https://www.python.org/downloads/ |
| **Node.js 16+** | https://nodejs.org/en/download/ |
| **Ollama** | https://ollama.ai/ |
| **LLM Model** | `ollama pull qwen3:latest` (or your preferred model) |

> **Note**: The app is configured for Ollama on `http://localhost:11434` by default.

---

## 🚀 Quick Start

### 1. **Clone Repository**
```bash
git clone <your-repo-url>
cd Local-LLM-Chat-MVP
```

### 2. **Setup Backend**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. **Setup Frontend** 
```bash
cd frontend
npm install
```

### 4. **Start Ollama**
```bash
ollama serve    # In separate terminal
ollama pull qwen3:latest  # Or your preferred model
```

### 5. **Start Development Servers**

**Option A - Concurrent (Recommended):**
```bash
cd frontend
npm run dev    # Starts both backend and frontend
```

**Option B - Separate terminals:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn app:app --reload

# Terminal 2 - Frontend  
cd frontend
npm run vite
```

### 6. **Open Application**
Navigate to `http://localhost:5173`

---

## 🎯 Usage

### **Regular Chat**
1. Type your message in the input field
2. Click **Send** or press Enter
3. Watch the AI respond with thinking process visible

### **Web Search**
1. Type your search query
2. Click the **🦆🦆→** button 
3. See search results appear first, followed by AI analysis

### **Input Commands**
- **Enter**: Send regular chat message
- **Shift+Enter**: New line in input
- **🦆🦆→ Button**: Trigger intelligent web search
- **Send Button**: Regular LLM chat

---

## 🔧 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/chat` | **Regular chat** - forwards to Ollama with streaming |
| `POST` | `/search` | **Intelligent search** - web search + LLM filtering + synthesis |
| `GET` | `/` | Health check endpoint |

### **Request Format**
```json
{
  "model": "qwen3:latest",
  "messages": [{"role": "user", "content": "Your message"}],
  "query": "search terms",  // for search endpoint only
  "max_results": 2          // for search endpoint only
}
```

---

## 🛠️ Development Notes

### **Streaming Architecture**
- **Enabled by default** for real-time responses
- **Thinking tags** (`<think>`) are parsed and displayed separately
- **Chunked processing** handles partial JSON gracefully

### **Search Implementation**
- **DuckDuckGo API** primary source with BeautifulSoup fallback
- **LLM filtering** uses separate non-streaming request for ranking
- **Result caching** and error handling built-in

### **Environment Configuration**
Create `backend/.env` for custom settings:
```env
OLLAMA_URL=http://localhost:11434/api/chat
```

### **CORS Configuration**  
Backend allows `http://localhost:5173` by default. Add domains to `allow_origins` in `app.py` as needed.

---

## 🎨 Customization

### **Styling**
- **Styled-components** for component-scoped CSS
- **Responsive breakpoints** at 768px and 1025px
- **Color scheme** customizable via styled-component props

### **Models**
Change the default model by updating:
- `model: 'qwen3:latest'` in frontend components
- Ensure model is pulled: `ollama pull <model-name>`

### **Search Sources**
Extend `search_service.py` to add additional search providers or modify ranking algorithms.

---

## 📜 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using FastAPI, React, and Ollama**