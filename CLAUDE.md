# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Local LLM Chat MVP - a lightweight chat application that serves as a proxy between a Vite frontend and the Ollama LLM engine. The project consists of two main components:

- **Backend**: FastAPI server (`backend/app.py`) that proxies requests to Ollama at `http://localhost:11434/api/chat`
- **Frontend**: Vite-powered vanilla JavaScript SPA that provides a chat interface

## Architecture

The application follows a simple proxy pattern:
1. Frontend (Vite dev server on `localhost:5173`) sends chat requests to backend
2. Backend (FastAPI on `localhost:8000`) forwards requests to Ollama server
3. Ollama responses are returned unchanged to the frontend
4. CORS is configured to allow communication between frontend and backend

## Development Commands

### Frontend (run from `frontend/` directory)
- `npm install` - Install dependencies
- `npm run dev` - Start both backend and frontend servers concurrently
- `npm run vite` - Start only the Vite dev server
- `npm run server` - Start only the FastAPI backend server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

### Backend (run from `backend/` directory)
- `python -m venv venv` - Create virtual environment
- `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows) - Activate virtual environment
- `pip install -r requirements.txt` - Install Python dependencies
- `uvicorn app:app --reload` - Start FastAPI server with hot reload

### Full Development Setup
From project root, the quickest way to start development:
```bash
cd frontend && npm run dev
```
This starts both frontend and backend servers concurrently.

## Key Files and Structure

- `backend/app.py` - Main FastAPI application with single `/chat` endpoint
- `backend/requirements.txt` - Python dependencies (FastAPI, uvicorn, httpx, python-dotenv)
- `frontend/package.json` - Frontend dependencies and npm scripts
- `frontend/vite.config.js` - Vite configuration with proxy setup for `/api` routes
- `frontend/src/main.js` - Frontend entry point (currently basic Vite template)

## Environment Configuration

- Backend accepts `OLLAMA_URL` environment variable (defaults to `http://localhost:11434/api/chat`)
- Create `.env` file in `backend/` directory for custom configuration
- CORS is configured to allow `http://localhost:5173` (Vite dev server)

## Prerequisites

- Python 3.8+
- Node.js 16+
- Ollama server running on `localhost:11434`
- An Ollama model pulled and available (e.g., `ollama pull gpt4o-mini`)

## Development Notes

- **Streaming enabled**: The backend automatically enables streaming for real-time responses
- **Thinking visualization**: The app displays model thinking in real-time when using `<think></think>` tags
- **Responsive design**: Chat interface adapts from mobile (stacked input) to wide desktop layout
- **Real-time feedback**: Shows animated thinking bubble, then live thinking content, then final answer
- No authentication, logging, or rate limiting implemented - intentionally minimal
- The proxy forwards requests to Ollama with streaming enabled automatically