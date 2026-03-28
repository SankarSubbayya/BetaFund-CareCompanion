from fastapi import FastAPI
from evermemos import EverMemOS
import os

app = FastAPI()

# Get API key from environment
api_key = os.getenv("EVERMIND_API_KEY")
if not api_key:
    raise ValueError("EVERMIND_API_KEY not set")

memory_client = EverMemOS(api_key=api_key).v0.memories

@app.post("/memories")
async def add_memory(message: dict):
    response = memory_client.add(**message)
    return {"status": response.status, "message": response.message, "request_id": response.request_id}

@app.get("/memories")
async def get_memories(user_id: str):
    response = memory_client.get(extra_query={"user_id": user_id})
    return {"memories": response.result.memories}

@app.get("/memories/search")
async def search_memories(user_id: str, query: str):
    response = memory_client.search(extra_query={"user_id": user_id, "query": query})
    return {"total": response.result.total_count, "memories": response.result.memories}