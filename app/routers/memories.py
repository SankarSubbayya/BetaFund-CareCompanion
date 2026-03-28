"""API endpoints for EverMind memory operations."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.services.memory import store_memory, recall_memories, _get_client

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.post("")
async def create_memory(
    senior_phone: str,
    content: str,
    call_id: str = "",
):
    """Store a conversation memory for a senior."""
    success = await store_memory(senior_phone, content, call_id)
    return {"status": "stored" if success else "failed", "senior_phone": senior_phone}


@router.get("")
async def get_memories(user_id: str):
    """Get all memories for a senior."""
    client = _get_client()
    if client is None:
        return {"memories": []}
    try:
        response = client.get(extra_query={"user_id": user_id})
        return {"memories": response.result.memories}
    except Exception:
        return {"memories": []}


@router.get("/search")
async def search_memories(
    senior_phone: str,
    query: str = Query(default="previous concerns and health"),
):
    """Recall memories for a senior."""
    memories = await recall_memories(senior_phone, query)
    return {"senior_phone": senior_phone, "memories": memories, "count": len(memories)}
