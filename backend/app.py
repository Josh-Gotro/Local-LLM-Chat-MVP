import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv

load_dotenv()                       # load .env file
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")

app = FastAPI(title="Local LLM Proxy")

# Allow the Vite dev server (http://localhost:5173) to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(request: Request):
    """
    Accepts the same JSON body that Ollama expects and forwards it.
    """
    body = await request.json()
    # Basic validation: must contain `model` and `messages`
    if "model" not in body or "messages" not in body:
        raise HTTPException(status_code=400, detail="Missing required fields")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                OLLAMA_URL,
                json=body,
                timeout=120.0,
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Error contacting Ollama: {exc}"
            )
    return resp.json()