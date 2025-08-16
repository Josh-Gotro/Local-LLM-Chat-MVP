import os
import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
from dotenv import load_dotenv
from search_service import search_service

load_dotenv()                       # load .env file
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")

app = FastAPI(title="Local LLM Proxy")

@app.get("/")
async def root():
    print("[DEBUG] Root endpoint hit!")
    return {"message": "LLM Proxy Server", "version": "debug"}

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

async def filter_results_with_llm(query: str, results: list, max_results: int, model: str) -> list:
    """
    Use LLM to filter and rank search results by relevance to the query
    """
    if len(results) <= max_results:
        return results
    
    # Create a prompt for the LLM to rank results
    results_text = ""
    for i, result in enumerate(results):
        results_text += f"{i+1}. Title: {result['title']}\n"
        results_text += f"   Snippet: {result['snippet']}\n"
        results_text += f"   URL: {result['url']}\n\n"
    
    ranking_prompt = f"""You are a search relevance expert. Given the user's query and a list of search results, identify the {max_results} most relevant results that best answer the user's question.

User's query: "{query}"

Search results:
{results_text}

Please respond with ONLY the numbers of the {max_results} most relevant results, separated by commas (e.g., "3,1,5"). Choose results that:
1. Most directly answer the user's query
2. Provide the most useful information
3. Are from credible sources

Your response (numbers only):"""

    try:
        # Make a quick LLM request to rank results
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": ranking_prompt}],
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            
            ranking_response = response.json()
            selected_numbers = ranking_response.get("message", {}).get("content", "").strip()
            print(f"[DEBUG] LLM ranking response: {selected_numbers}")
            
            # Parse the selected numbers
            try:
                selected_indices = [int(x.strip()) - 1 for x in selected_numbers.split(",") if x.strip().isdigit()]
                # Ensure indices are valid and limit to max_results
                valid_indices = [i for i in selected_indices if 0 <= i < len(results)][:max_results]
                
                if valid_indices:
                    filtered_results = [results[i] for i in valid_indices]
                    print(f"[DEBUG] Selected indices: {valid_indices}")
                    return filtered_results
                else:
                    print("[DEBUG] No valid indices, falling back to first results")
                    return results[:max_results]
                    
            except (ValueError, IndexError) as e:
                print(f"[DEBUG] Error parsing LLM response: {e}, falling back to first results")
                return results[:max_results]
                
    except Exception as e:
        print(f"[DEBUG] Error in LLM filtering: {e}, falling back to first results")
        return results[:max_results]

@app.post("/search")
async def web_search_with_chat(request: Request):
    """
    Perform web search and synthesize results with LLM for conversational response
    """
    print("[DEBUG] /search endpoint hit! v2")
    body = await request.json()
    query = body.get("query", "").strip()
    model = body.get("model", "qwen3:latest")
    max_results = body.get("max_results", 5)
    print(f"[DEBUG] Query: {query}, Model: {model}, Max: {max_results}")
    
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    
    try:
        print(f"[DEBUG] Starting enhanced search for query: {query}")
        # First, perform the search - get more results for filtering
        initial_results = await search_service.search(query, max(max_results * 2, 5))
        print(f"[DEBUG] Found {len(initial_results)} initial search results")
        
        # Use LLM to filter and rank the most relevant results
        filtered_results = await filter_results_with_llm(query, initial_results, max_results, model)
        print(f"[DEBUG] Filtered to {len(filtered_results)} most relevant results")
        
        search_results = filtered_results
        print(f"[DEBUG] About to create streaming response...")
        
        # Prepare search context for LLM
        search_context = ""
        if search_results:
            search_context = "Based on the following search results:\n\n"
            for i, result in enumerate(search_results, 1):
                search_context += f"{i}. {result['title']}\n"
                search_context += f"   URL: {result['url']}\n"
                search_context += f"   Summary: {result['snippet']}\n\n"
        else:
            search_context = "No relevant search results were found for this query.\n\n"
        
        # Create the prompt for the LLM
        llm_prompt = f"""You are a helpful assistant with access to current web search results. Please provide a conversational, natural answer to the user's question based on the search results provided.

User's question: {query}

{search_context}

Please provide a direct, helpful answer based on this information. If the search results don't contain enough information to fully answer the question, acknowledge this and provide what information you can. Be conversational and natural in your response."""

        # Prepare the request for Ollama
        llm_body = {
            "model": model,
            "messages": [{"role": "user", "content": llm_prompt}],
            "stream": True
        }

        # Stream the LLM response
        async def stream_response():
            # First, send search results as a special message
            search_data = {
                "search_results": search_results,
                "query": query,
                "message": {"role": "assistant", "content": ""},
                "done": False
            }
            print(f"[DEBUG] Sending search results: {len(search_results)} results")
            yield f"{json.dumps(search_data)}\n"
            
            print(f"[DEBUG] About to call Ollama with prompt length: {len(llm_prompt)}")
            async with httpx.AsyncClient() as client:
                try:
                    async with client.stream(
                        "POST",
                        OLLAMA_URL,
                        json=llm_body,
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
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search and chat failed: {str(e)}"
        )

@app.post("/search-enhanced")
async def enhanced_search(request: Request):
    """
    Enhanced search with conversational response (new endpoint for testing)
    """
    body = await request.json()
    query = body.get("query", "").strip()
    model = body.get("model", "qwen3:latest")
    max_results = body.get("max_results", 3)
    
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    
    try:
        print(f"[ENHANCED] Starting search for: {query}")
        
        # Perform the search
        search_results = await search_service.search(query, max_results)
        print(f"[ENHANCED] Found {len(search_results)} results")
        
        # Simple synthesis prompt
        prompt = f"Based on these search results, please answer the question '{query}' in a conversational way:\n\n"
        for i, result in enumerate(search_results, 1):
            prompt += f"{i}. {result['title']}: {result['snippet']}\n"
        
        print(f"[ENHANCED] Sending to Ollama...")
        
        # Send to Ollama with streaming
        llm_body = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        }

        async def stream_response():
            async with httpx.AsyncClient() as client:
                try:
                    async with client.stream(
                        "POST",
                        OLLAMA_URL,
                        json=llm_body,
                        timeout=120.0,
                    ) as resp:
                        resp.raise_for_status()
                        async for chunk in resp.aiter_text():
                            if chunk:
                                yield chunk
                except Exception as e:
                    print(f"[ENHANCED] Error: {e}")
                    yield f'{{"error": "Error: {e}"}}\n'

        return StreamingResponse(
            stream_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        print(f"[ENHANCED] Exception: {e}")
        raise HTTPException(status_code=500, detail=f"Enhanced search failed: {str(e)}")

