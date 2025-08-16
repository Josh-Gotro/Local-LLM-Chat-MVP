import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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
    Accepts the same JSON body that Ollama expects and forwards it with streaming enabled.
    """
    body = await request.json()
    # Basic validation: must contain `model` and `messages`
    if "model" not in body or "messages" not in body:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Enable streaming
    body["stream"] = True

    async def stream_response():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    OLLAMA_URL,
                    json=body,
                    timeout=120.0,
                ) as resp:
                    resp.raise_for_status()
                    async for chunk in resp.aiter_text():
                        if chunk:
                            yield chunk
            except httpx.HTTPError as exc:
                error_response = f'{{"error": "Error contacting Ollama: {exc}"}}\n'
                yield error_response

    return StreamingResponse(
        stream_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )