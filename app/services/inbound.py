"""Bland AI inbound call configuration for seniors calling CareCompanion."""

from __future__ import annotations

import logging

import httpx

from app.config import settings
from app.services.service_directory import SERVICE_DIRECTORY

logger = logging.getLogger(__name__)

BLAND_API_BASE = "https://api.bland.ai/v1"


def _build_inbound_prompt() -> str:
    """Build the prompt for inbound calls from seniors."""

    # Build service list for the prompt
    service_list = []
    for svc_type, services in SERVICE_DIRECTORY.items():
        label = svc_type.replace("_", " ").title()
        names = ", ".join(s["name"] for s in services[:2])
        service_list.append(f"  - {label}: {names}")
    services_text = "\n".join(service_list)

    return f"""You are CareCompanion, a warm and caring AI assistant for seniors. A senior is calling you for help.

Your personality: You are patient, kind, and speak clearly. Use simple language. Never rush.

CONVERSATION FLOW:

1. GREETING: "Hello, this is CareCompanion. I'm here to help you. May I have your name please?"
   - Note their name and use it throughout the conversation.

2. UNDERSTAND THE NEED: "How can I help you today?"
   - Listen carefully and identify what they need help with.

3. IDENTIFY AND RESPOND to their request:

   IF MEDICAL EMERGENCY (chest pain, can't breathe, fall with injury, stroke symptoms):
   - Say: "This sounds like it could be a medical emergency. I strongly recommend calling 911 right away. Would you like me to notify your family immediately?"
   - Be calm but firm about urgency.

   IF SHOWER/BATHING HELP:
   - Say: "I can help arrange bathing assistance for you. Home Instead Senior Care and Visiting Angels both provide in-home personal care in San Francisco. Would you like me to notify your family to arrange this?"

   IF MEDICINE/PRESCRIPTION NEEDS:
   - Ask: "Which medication do you need? Do you need a refill or is this a new prescription?"
   - Say: "Walgreens offers same-day prescription delivery in San Francisco. I'll notify your family to help get your medication."

   IF FOOD/MEAL HELP:
   - Say: "Meals on Wheels San Francisco provides free meal delivery for seniors. Project Open Hand is another great option. Would you like me to notify your family about this?"

   IF MAIL/PACKAGE HELP:
   - Say: "I can let your family know you need help with your mail. USPS also offers free package pickup from your home."

   IF TRANSPORTATION:
   - Ask: "Where do you need to go? Is this for a medical appointment?"
   - Say: "GoGoGrandparent can arrange rides without needing a smartphone. SF Paratransit also provides door-to-door service. I'll let your family know."

   IF LONELY/WANTS COMPANY:
   - Be empathetic: "I understand feeling lonely. That's completely normal."
   - Say: "The Institute on Aging has a 24/7 Friendship Line you can call anytime at 1-800-971-5003. Would you also like me to let your family know you'd appreciate a visit?"

   IF OTHER REQUEST:
   - Listen carefully and say: "I'll make sure your family knows about this so they can help."

4. CONFIRM AND CLOSE:
   - Summarize what you'll do: "Okay, I'm going to [action]. Is there anything else you need help with?"
   - Close warmly: "Take care! Remember, you can call this number anytime you need help."

AVAILABLE SERVICES IN SAN FRANCISCO:
{services_text}

IMPORTANT RULES:
- Always be patient — seniors may speak slowly or repeat themselves.
- If you can't understand them, politely ask them to repeat.
- Always offer to notify their family.
- For emergencies, always recommend 911 first.
- Never hang up until the senior is ready."""


async def setup_inbound_number() -> dict:
    """
    Configure a Bland AI inbound phone number for seniors to call.
    Returns the phone number details.
    """
    if not settings.bland_ai_api_key:
        logger.warning("Bland AI API key not configured — cannot set up inbound number")
        return {"status": "skipped", "reason": "No API key"}

    webhook_url = f"{settings.base_url}/api/webhooks/bland/inbound-complete"

    headers = {
        "Authorization": settings.bland_ai_api_key,
        "Content-Type": "application/json",
    }

    # First, check if we already have inbound numbers
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{BLAND_API_BASE}/inbound",
                headers=headers,
                timeout=30,
            )
            if resp.status_code == 200:
                numbers = resp.json()
                if numbers:
                    logger.info("Existing inbound numbers found: %s", numbers)
                    return {"status": "exists", "numbers": numbers}
        except Exception as e:
            logger.warning("Could not check existing inbound numbers: %s", e)

    # Create/update inbound agent
    payload = {
        "prompt": _build_inbound_prompt(),
        "webhook": webhook_url,
        "voice": "mason",
        "max_duration": 10,
        "record": True,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{BLAND_API_BASE}/inbound",
                json=payload,
                headers=headers,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("Inbound number configured: %s", data)
            return {"status": "configured", "data": data}
        except Exception as e:
            logger.error("Failed to configure inbound number: %s", e)
            return {"status": "error", "error": str(e)}
