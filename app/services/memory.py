"""
EverMind integration — persistent memory for senior conversations.
Remembers past check-ins so the AI can follow up on previous concerns.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

EVERMIND_BASE = "http://localhost:1995/api/v1"


async def store_memory(senior_phone: str, content: str, call_id: str = "") -> bool:
    """Store a conversation memory for a senior."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{EVERMIND_BASE}/memories",
                json={
                    "message_id": call_id or f"mem_{senior_phone}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                    "create_time": datetime.now(timezone.utc).isoformat(),
                    "sender": senior_phone,
                    "content": content,
                },
                timeout=10,
            )
            if resp.status_code in (200, 202):
                logger.info("Stored memory for %s", senior_phone)
                return True
            else:
                logger.warning("EverMind store failed: %s", resp.text)
                return False
    except Exception as e:
        logger.debug("EverMind not available: %s", e)
        return False


async def recall_memories(senior_phone: str, query: str = "previous concerns and health") -> list[str]:
    """Retrieve relevant memories for a senior to personalize the next call."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{EVERMIND_BASE}/memories/search",
                json={
                    "query": query,
                    "user_id": senior_phone,
                    "memory_types": ["episodic_memory"],
                    "retrieve_method": "hybrid",
                },
                timeout=10,
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            memories = []
            for group in data.get("result", {}).get("memories", []):
                if isinstance(group, dict):
                    memories.append(group.get("content", str(group)))
                elif isinstance(group, str):
                    memories.append(group)
            return memories
    except Exception as e:
        logger.debug("EverMind not available: %s", e)
        return []


def format_memory_context(memories: list[str], senior_name: str) -> str:
    """Format memories into a prompt context block for Bland AI."""
    if not memories:
        return ""

    memory_text = "\n".join(f"- {m}" for m in memories[:5])
    return f"""
IMPORTANT CONTEXT FROM PREVIOUS CALLS WITH {senior_name.upper()}:
{memory_text}

Use this context to:
- Follow up on previous concerns (e.g., "Last time you mentioned your hip was hurting. How is it feeling?")
- Acknowledge past events (e.g., "I remember you said your daughter was visiting. How was the visit?")
- Show continuity of care (e.g., "You mentioned feeling lonely last week. Have things been better?")
Do NOT repeat this context verbatim — weave it naturally into the conversation.
"""
