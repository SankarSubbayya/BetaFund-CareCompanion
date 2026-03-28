"""
Scheduling & Notification Agent — Manages appointments and notifies all parties.

Responsibilities:
- Schedule/reschedule check-in times
- Manage medical appointments
- Send notifications to family when alerts fire
- Coordinate between seniors and caregivers
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.database import get_db
from app.models.senior import Senior
from app.models.alert import Alert
from app.services.scheduler import schedule_senior

logger = logging.getLogger(__name__)

BLAND_API_BASE = "https://api.bland.ai/v1"


async def notify_family(alert: Alert) -> dict:
    """Call the emergency contact to notify them about an alert."""
    db = get_db()
    senior_record = db.get("seniors", alert.senior_phone)
    if not senior_record:
        return {"status": "error", "reason": "senior not found"}

    senior = Senior(**senior_record)
    if not senior.emergency_contacts:
        logger.warning("No emergency contacts for %s", senior.name)
        return {"status": "skipped", "reason": "no emergency contacts"}

    contact = senior.emergency_contacts[0]
    contact_phone = contact.get("phone") if isinstance(contact, dict) else contact.phone
    contact_name = contact.get("name", "") if isinstance(contact, dict) else contact.name

    if not settings.bland_ai_api_key:
        logger.info("Mock notification to %s about %s", contact_name, alert.message)
        return {"status": "mock", "contact": contact_name}

    severity_urgency = {
        "critical": "This is urgent and requires immediate attention.",
        "high": "This is important and needs your attention soon.",
        "medium": "This is something you should be aware of.",
        "low": "This is a minor update for your information.",
    }

    prompt = f"""You are CareCompanion's Notification Agent. You are calling {contact_name} to inform them about their loved one, {senior.name}.

Be calm, clear, and compassionate.

SAY THIS:
"Hello {contact_name}, this is CareCompanion calling about {senior.name}.

{alert.message}

{severity_urgency.get(alert.severity, '')}

{'Please call 911 if you believe this is a medical emergency.' if alert.severity == 'critical' else ''}

Is there anything you'd like us to do? We can schedule a follow-up call or adjust {senior.name}'s care plan.

Thank you for being there for {senior.name}. Take care."

Keep the call brief and focused. Answer any questions the family member has about the situation.
"""

    payload = {
        "phone_number": contact_phone,
        "task": prompt,
        "webhook": f"{settings.base_url}/api/webhooks/bland/notification-complete",
        "voice": "mason",
        "max_duration": 5,
        "record": True,
    }

    headers = {
        "Authorization": settings.bland_ai_api_key,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{BLAND_API_BASE}/calls",
                json=payload,
                headers=headers,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as e:
            logger.error("Bland.ai API error notifying %s: %s", contact_name, e)
            return {"status": "error", "reason": f"API error: {e.response.status_code}", "agent": "notification", "contact": contact_name}
        except httpx.RequestError as e:
            logger.error("Network error notifying %s: %s", contact_name, e)
            return {"status": "error", "reason": "network error", "agent": "notification", "contact": contact_name}

    call_id = data.get("call_id", "")
    logger.info("Notification call %s to %s (%s) about: %s",
                call_id, contact_name, contact_phone, alert.alert_type)

    # Log the notification
    db.put("notifications", f"{alert.senior_phone}:{datetime.now(timezone.utc).isoformat()}", {
        "alert_id": alert.id,
        "contact_name": contact_name,
        "contact_phone": contact_phone,
        "call_id": call_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "initiated",
    })

    return {"call_id": call_id, "status": "initiated", "agent": "notification", "contact": contact_name}


async def schedule_appointment(
    senior_phone: str,
    appointment_type: str,
    date: str,
    time: str,
    notes: str = "",
) -> dict:
    """Schedule an appointment and set a reminder."""
    db = get_db()
    senior_record = db.get("seniors", senior_phone)
    if not senior_record:
        return {"status": "error", "reason": "senior not found"}

    appointment = {
        "senior_phone": senior_phone,
        "senior_name": senior_record.get("name", ""),
        "type": appointment_type,
        "date": date,
        "time": time,
        "notes": notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "scheduled",
    }

    key = f"{senior_phone}:{date}:{time}"
    db.put("appointments", key, appointment)

    logger.info("Scheduled %s for %s on %s at %s",
                appointment_type, senior_record.get("name"), date, time)

    return {"status": "scheduled", "appointment": appointment, "agent": "scheduling"}


async def update_checkin_schedule(senior_phone: str, new_time: str) -> dict:
    """Update a senior's daily check-in time."""
    db = get_db()
    senior_record = db.get("seniors", senior_phone)
    if not senior_record:
        return {"status": "error", "reason": "senior not found"}

    senior_record["checkin_schedule"] = new_time
    db.put("seniors", senior_phone, senior_record)

    senior = Senior(**senior_record)
    schedule_senior(senior)

    logger.info("Updated check-in time for %s to %s", senior.name, new_time)
    return {"status": "updated", "senior": senior.name, "new_time": new_time, "agent": "scheduling"}


def get_appointments(senior_phone: str) -> list[dict]:
    """Get all appointments for a senior."""
    db = get_db()
    return db.scan_prefix("appointments", senior_phone)
