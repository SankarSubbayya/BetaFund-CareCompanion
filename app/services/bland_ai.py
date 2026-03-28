"""Bland AI voice call integration for senior check-ins."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.models.senior import Senior

logger = logging.getLogger(__name__)

BLAND_API_BASE = "https://api.bland.ai/v1"

# In-memory mapping of call_id -> senior phone for webhook correlation
call_id_to_phone: dict[str, str] = {}


def _build_checkin_prompt(senior: Senior) -> str:
    """Build the voice agent prompt for a senior check-in call."""
    meds_list = ", ".join(senior.medications) if senior.medications else "no specific medications listed"

    return f"""You are CareCompanion, a warm and friendly AI care assistant calling {senior.name} for their daily check-in.

Your personality: You are patient, kind, and genuinely caring. Speak clearly and at a moderate pace. Use simple language.

Follow this conversation flow:

1. GREETING: "Hi {senior.name}, this is CareCompanion calling for your daily check-in. How are you feeling today?"
   - Listen carefully to their response. Note any mentions of pain, discomfort, or distress.

2. MEDICATION CHECK: "Have you taken your medications today? You should have taken: {meds_list}."
   - If they say yes, acknowledge positively.
   - If they say no or ran out, ask: "Would you like me to notify your family to help get your medications?"
   - If they're unsure, encourage them to check.

3. WELLNESS CHECK: "Is there anything you need help with today? Any concerns or anything on your mind?"
   - Listen for mentions of: falls, dizziness, pain, loneliness, confusion, difficulty with daily tasks.

4. SERVICE NEEDS: If they mention needing help with any of the following, ask follow-up questions:
   - SHOWER/BATHING HELP: "Would you like me to arrange for someone to help you with that? When would you need the help — today or tomorrow?"
   - MEDICINE/PRESCRIPTION NEEDS: "I'll let your family know you need your medications. Do you know which medication you need refilled?"
   - GROCERY/MEAL HELP: "Would you like me to notify your family that you need help with groceries or meals?"
   - TRANSPORTATION: "Do you need a ride somewhere? I'll let your family know so they can help arrange it."
   - OTHER HELP: For any other request, say: "I'll make sure your family knows about this so they can help."
   Always confirm: "I'll notify your family right away about your request."

5. CLOSING: "Thank you for chatting with me, {senior.name}. Take care and I'll call you again tomorrow. If you need anything before then, don't hesitate to reach out to your family."

IMPORTANT SAFETY RULES:
- If the senior mentions a fall, injury, chest pain, or any emergency, express concern and say: "That sounds serious. I'm going to make sure your family is notified right away. If this is an emergency, please hang up and call 911."
- If they sound confused or disoriented, note it clearly.
- If they express loneliness or sadness, be empathetic and suggest calling a family member.
- Always be respectful and never rush the conversation.
- When a service need is identified, always reassure them that help is on the way.

{f"Additional notes about {senior.name}: {senior.notes}" if senior.notes else ""}"""


async def initiate_checkin_call(senior: Senior) -> dict:
    """Initiate a check-in call to a senior via Bland AI."""
    if not settings.bland_ai_api_key:
        logger.warning("Bland AI API key not configured — using mock mode")
        return _mock_call(senior)

    # Recall memories from EverMind for personalized conversation
    from app.services.memory import recall_memories, format_memory_context
    memories = await recall_memories(senior.phone)
    memory_context = format_memory_context(memories, senior.name)

    prompt = _build_checkin_prompt(senior)
    if memory_context:
        prompt += "\n" + memory_context
        logger.info("Added %d memories to call prompt for %s", len(memories), senior.name)

    webhook_url = f"{settings.base_url}/api/webhooks/bland/call-complete"

    payload = {
        "phone_number": senior.phone,
        "task": prompt,
        "webhook": webhook_url,
        "voice": "mason",
        "max_duration": 5,
        "record": True,
        "answered_by_enabled": True,
        "wait_for_greeting": True,
        "ring_timeout": 60,
        "voicemail_action": "leave_message",
        "voicemail_message": f"Hi {senior.name}, this is CareCompanion calling for your daily check-in. We'll try again later. If you need anything, please call us back. Take care!",
    }

    headers = {
        "Authorization": settings.bland_ai_api_key,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BLAND_API_BASE}/calls",
            json=payload,
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

    call_id = data.get("call_id", "")
    call_id_to_phone[call_id] = senior.phone
    logger.info("Initiated call %s to %s (%s)", call_id, senior.name, senior.phone)

    return {"call_id": call_id, "status": "initiated", "senior_phone": senior.phone}


async def get_call_transcript(call_id: str) -> dict:
    """Fetch call details and transcript from Bland AI."""
    if not settings.bland_ai_api_key:
        return {}

    headers = {"Authorization": settings.bland_ai_api_key}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BLAND_API_BASE}/calls/{call_id}",
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


def _mock_call(senior: Senior) -> dict:
    """Return a mock call response for development without Bland AI."""
    mock_id = f"mock_{senior.phone}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    call_id_to_phone[mock_id] = senior.phone
    logger.info("Mock call %s for %s", mock_id, senior.name)
    return {"call_id": mock_id, "status": "mock", "senior_phone": senior.phone}
