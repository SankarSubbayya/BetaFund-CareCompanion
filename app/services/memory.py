"""
EverMind integration — persistent memory for senior conversations.
Remembers past check-ins so the AI can follow up on previous concerns.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger(__name__)

# Initialize EverMemOS client
_memory_client = None


def _get_client():
    global _memory_client
    if _memory_client is None:
        if not settings.evermind_api_key:
            return None
        from evermemos import EverMemOS
        _memory_client = EverMemOS(api_key=settings.evermind_api_key).v0.memories
    return _memory_client


async def store_memory(senior_phone: str, content: str, call_id: str = "") -> bool:
    """Store a conversation memory for a senior."""
    try:
        client = _get_client()
        if client is None:
            logger.debug("EverMind not configured (no API key)")
            return False

        response = client.add(
            message_id=call_id or f"mem_{senior_phone}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            create_time=datetime.now(timezone.utc).isoformat(),
            sender=senior_phone,
            content=content,
        )
        logger.info("Stored memory for %s: %s", senior_phone, response.status)
        return True
    except Exception as e:
        logger.debug("EverMind not available: %s", e)
        return False


async def recall_memories(senior_phone: str, query: str = "previous concerns and health") -> list[str]:
    """Retrieve relevant memories for a senior to personalize the next call."""
    try:
        client = _get_client()
        if client is None:
            return []

        response = client.search(
            extra_query={
                "query": query,
                "user_id": senior_phone,
            },
        )
        memories = []
        for mem in response.result.memories:
            if isinstance(mem, dict):
                memories.append(mem.get("content", str(mem)))
            elif hasattr(mem, "content"):
                memories.append(mem.content)
            elif isinstance(mem, str):
                memories.append(mem)
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
