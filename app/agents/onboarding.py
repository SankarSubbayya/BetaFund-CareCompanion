"""
Onboarding Agent — Registers new seniors via voice call.

Calls a family member or senior to collect:
- Senior's name, phone number
- Medications and dosages
- Emergency contacts
- Preferred check-in time
- Any special notes (mobility issues, dietary needs, etc.)

After the call, creates the senior profile automatically.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.database import get_db
from app.models.senior import Senior
from app.services.scheduler import schedule_senior

logger = logging.getLogger(__name__)

BLAND_API_BASE = "https://api.bland.ai/v1"


def _build_onboarding_prompt() -> str:
    return """You are CareCompanion's Onboarding Assistant. A family member or senior is calling to register for daily check-in services.

Your personality: Professional, warm, and reassuring. Speak clearly.

CONVERSATION FLOW:

1. INTRODUCTION:
   "Hello! Thank you for reaching out to CareCompanion. I'm going to help you set up daily check-in calls for your loved one. This will only take a few minutes."

2. COLLECT SENIOR INFO:
   Ask each question one at a time. Wait for the answer before moving on.

   a) "First, what is the name of the person who will be receiving the check-in calls?"
   b) "What is their phone number? Please include the area code."
   c) "What medications do they take? Please list each one, including the dosage if you know it."
   d) "What time of day would be best for the daily check-in call? For example, 9 AM or 10 AM."
   e) "Is there anything else I should know about them? For example, mobility issues, dietary restrictions, or things they enjoy talking about."

3. EMERGENCY CONTACT:
   "Now let me get your information as the emergency contact."
   a) "What is your name?"
   b) "What is your phone number?"
   c) "What is your relationship to [senior name]? For example, daughter, son, spouse."

4. CONFIRM AND CLOSE:
   Summarize everything back:
   "Let me confirm what I have:
   - [Senior name] at [phone number]
   - Medications: [list]
   - Daily check-in at [time]
   - Emergency contact: [name], [relationship], at [number]

   Does everything sound correct?"

   If yes: "Wonderful! [Senior name] will receive their first check-in call at [time]. We'll ask about their mood, medications, and if they need any help. You'll be able to see everything on the family dashboard. Thank you for trusting CareCompanion!"

   If corrections needed: Make the corrections and confirm again.

IMPORTANT:
- Be patient — the caller may be elderly or emotional
- If they're unsure about medications, say "That's okay, you can update this later on the dashboard"
- Always be reassuring about the service
"""


async def start_onboarding_call(phone_number: str) -> dict:
    """Call a family member to onboard a new senior."""
    if not settings.bland_ai_api_key:
        logger.warning("Bland AI not configured — mock onboarding")
        return {"call_id": f"mock_onboard_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}", "status": "mock"}

    webhook_url = f"{settings.base_url}/api/webhooks/bland/onboarding-complete"

    payload = {
        "phone_number": phone_number,
        "task": _build_onboarding_prompt(),
        "webhook": webhook_url,
        "voice": "mason",
        "max_duration": 10,
        "record": True,
        "wait_for_greeting": True,
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
    logger.info("Onboarding call %s to %s", call_id, phone_number)
    return {"call_id": call_id, "status": "initiated", "agent": "onboarding"}


def process_onboarding_transcript(transcript: str) -> dict:
    """Extract senior registration info from onboarding call transcript."""
    import re

    text = transcript.lower()
    result = {
        "senior_name": "",
        "senior_phone": "",
        "medications": [],
        "checkin_schedule": "09:00",
        "emergency_contact_name": "",
        "emergency_contact_phone": "",
        "emergency_contact_relation": "",
        "notes": "",
    }

    # Extract phone numbers (E.164 or common formats)
    phones = re.findall(r'[\+]?1?\s*[\(]?\d{3}[\)]?\s*[\-]?\s*\d{3}\s*[\-]?\s*\d{4}', transcript)
    if len(phones) >= 1:
        result["senior_phone"] = re.sub(r'[^\d+]', '', phones[0])
        if not result["senior_phone"].startswith("+"):
            result["senior_phone"] = "+1" + result["senior_phone"].lstrip("1")
    if len(phones) >= 2:
        result["emergency_contact_phone"] = re.sub(r'[^\d+]', '', phones[1])

    # Extract time
    time_match = re.search(r'(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)', text)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2) or 0)
        period = time_match.group(3).replace(".", "")
        if period == "pm" and hour != 12:
            hour += 12
        if period == "am" and hour == 12:
            hour = 0
        result["checkin_schedule"] = f"{hour:02d}:{minute:02d}"

    # Extract medications (common patterns)
    med_patterns = [
        r'metformin', r'lisinopril', r'amlodipine', r'atorvastatin',
        r'aspirin', r'vitamin\s*d', r'multivitamin', r'omeprazole',
        r'levothyroxine', r'losartan', r'gabapentin', r'hydrochlorothiazide',
    ]
    for pattern in med_patterns:
        if re.search(pattern, text):
            # Get the full medication mention with dosage
            match = re.search(rf'({pattern}[\w\s]*?\d*\s*(?:mg|mcg|iu)?)', text)
            if match:
                result["medications"].append(match.group(1).strip().title())
            else:
                result["medications"].append(pattern.replace(r'\s*', ' ').title())

    # Extract relationship
    for rel in ["daughter", "son", "spouse", "wife", "husband", "granddaughter", "grandson", "niece", "nephew", "friend", "neighbor", "caregiver"]:
        if rel in text:
            result["emergency_contact_relation"] = rel
            break

    return result


def create_senior_from_onboarding(data: dict) -> Senior | None:
    """Create a senior profile from extracted onboarding data."""
    if not data.get("senior_phone"):
        return None

    emergency_contacts = []
    if data.get("emergency_contact_name") or data.get("emergency_contact_phone"):
        emergency_contacts.append({
            "name": data.get("emergency_contact_name", ""),
            "phone": data.get("emergency_contact_phone", ""),
            "relation": data.get("emergency_contact_relation", ""),
        })

    senior = Senior(
        name=data.get("senior_name", "New Senior"),
        phone=data["senior_phone"],
        medications=data.get("medications", []),
        checkin_schedule=data.get("checkin_schedule", "09:00"),
        notes=data.get("notes", ""),
        emergency_contacts=emergency_contacts,
    )

    db = get_db()
    db.put("seniors", senior.phone, senior.model_dump())
    schedule_senior(senior)

    logger.info("Onboarded new senior: %s (%s)", senior.name, senior.phone)
    return senior
