# CHAT – A Local LLM Proxy & Front‑end

**Chat** is a tiny, self‑contained project that lets you run a lightweight chat 
UI on your machine while using the *Ollama* LLM engine (or any other 
locally‑hosted LLM that exposes a REST API).  
The app is split into two parts:

| Part | What it is | Communication |
|------|------------|--------------|
| **Backend** | A `FastAPI` server that:<br>• Receives `POST /chat` requests<br>• Forwards to Ollama server (`/api/chat`)<br>• Returns response unchanged | Uses CORS middleware to allow frontend calls from `localhost:5173` |
| **Frontend** | A Vite-powered React SPA that:<br>• Lets users send chat messages<br>• Displays AI replies | Calls backend's `/chat` endpoint at `http://localhost:8000/chat` |

> **Why use this?**  
> Ollama’s REST endpoint can be used from any language, but you might want a 
thin, type‑safe wrapper that handles CORS, logs traffic, or adds any future 
middle‑man logic. This repo gives you that in a single‑repo solution that is 
trivial to spin up.

---

## 📦 Project Structure

```
CHAT/                  ← root
├─ backend/            ← FastAPI (Python 3.8+)
│  ├─ app.py           ← API logic
│  ├─ requirements.txt
│  └─ venv/            ← (created on install)
├─ frontend/           ← Vite + React (or your framework)
│  ├─ src/
│  ├─ index.html
│  └─ package.json
└─ README.md           ← this file
```

> **Tip** – All Python code lives under `backend/`; all front‑end code lives 
under `frontend/`.

---

## ⚙️ Prerequisites

| What | How to install |
|------|----------------|
| **Python 3.8+** | <https://www.python.org/downloads/> |
| **Node.js** (>=16) | <https://nodejs.org/en/download/> |
| **Ollama** (LLM engine) | <https://ollama.ai/> |
| **An LLM model** you want to chat with (e.g. `gpt-oss-20b`, `phi3`, …) | 
`ollama pull <model>` |

> **Note** – The proxy is configured to forward to `http://localhost:11434` by 
default, which is the standard Ollama listening port.

---

## Getting Started

> **All commands are run from the repository root (`CHAT/`).**

### 1. Clone / Copy

```bash
git clone https://github.com/your-username/CHAT.git   # or just copy the repo
cd CHAT
```

### 2. Install the backend dependencies

```bash
python -m venv venv          # create a virtual environment
source venv/bin/activate     # on Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

> If you prefer **Docker**, the Dockerfile (not shown) can be built for the 
backend.  
> For simplicity this readme assumes local installs.

### 3. Install the frontend dependencies

```bash
cd frontend
npm install
```

### 4. Pull an LLM model (if you haven’t already)

```bash
# Example: pull the GPT‑4‑mini model
ollama pull gpt4o-mini
```

> Run the Ollama daemon *before* starting the app:

```bash
ollama serve            # in its own terminal window
```

### 5. Configure the environment (optional)

If you need a custom Ollama URL, create a `.env` file in `backend/`:

```
OLLAMA_URL=http://localhost:11434/api/chat
```

> If you leave the file out, the default is used.

### 6. Start the servers

#### a. **Backend** (FastAPI)

```bash
cd backend
source venv/bin/activate      # activate the same venv as before
uvicorn app:app --reload
```

You’ll see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### b. **Frontend** (Vite)

```bash
cd frontend
npm run dev
```

Vite will output:

```
 VITE vX.X.X  ready
 ➜  Local:   http://localhost:5173/
```

> If you want both to run together from the root, you can use the npm script 
defined in `frontend/package.json`:

```bash
npm run dev          # runs both the Vite dev server and the FastAPI backend in 
parallel
```

### 7. Test the chat UI

Open your browser to `http://localhost:5173/`.  
Type a message, hit **Send**, and you should see the response from the LLM 
appear in the UI.

---

## 📄 API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Accepts a JSON body `{ model: "...", messages: 
[{role:"user",content:"..."}, ...] }`. Forwards the request to Ollama and 
streams back the full JSON response. |

> **CORS**: The backend allows `http://localhost:5173` (the Vite dev server). 
If you host the front‑end elsewhere, add that domain to the `allow_origins` 
list in `backend/app.py`.

---

## 🔧 Development Notes

- **Streaming** was originally enabled; it was turned off in `app.py` for 
simplicity.  
- To re‑enable streaming, set `stream=True` in the `client.post()` call and 
adjust the response parsing accordingly.
- All code is intentionally minimal – feel free to extend the proxy with 
authentication, logging, rate‑limiting, or any other middleware.

---

## 📜 License

MIT – see `LICENSE` file.

---