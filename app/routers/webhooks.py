"""Bland AI webhook receiver — routes calls to the appropriate agent."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request

from app.database import get_db
from app.services.bland_ai import call_id_to_phone
from app.agents.daily_checkin import process_checkin_result
from app.agents.onboarding import process_onboarding_transcript, create_senior_from_onboarding

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/bland/call-complete")
async def bland_call_complete(request: Request):
    """Webhook for completed outbound check-in calls → Daily Check-in Agent."""
    body = await request.json()
    logger.info("Webhook received (outbound): call_id=%s", body.get("call_id"))

    call_id = body.get("call_id", "")
    transcript = body.get("concatenated_transcript", "") or body.get("transcript", "")
    status = body.get("status", "completed")

    senior_phone = call_id_to_phone.pop(call_id, None)
    if not senior_phone:
        logger.warning("Unknown call_id: %s", call_id)
        return {"status": "ignored", "reason": "unknown call_id"}

    if status in ("no-answer", "voicemail", "failed"):
        from datetime import datetime, timezone
        from app.models.checkin import CheckIn
        from app.services.alert_engine import evaluate_checkin

        db = get_db()
        senior_record = db.get("seniors", senior_phone)
        senior_name = senior_record.get("name", "") if senior_record else ""
        now = datetime.now(timezone.utc).isoformat()

        checkin = CheckIn(
            senior_phone=senior_phone, call_id=call_id, timestamp=now,
            mood="unknown", wellness_score=0, concerns=["no_answer"],
            summary=f"Call {status} — senior did not answer",
        )
        db.put("checkins", f"{senior_phone}:{now}", checkin.model_dump())
        evaluate_checkin(checkin, senior_name)
        return {"status": "processed", "result": "no_answer"}

    db = get_db()
    senior_record = db.get("seniors", senior_phone)
    senior_name = senior_record.get("name", "") if senior_record else ""

    return await process_checkin_result(senior_phone, call_id, transcript, senior_name)


@router.post("/bland/inbound-complete")
async def bland_inbound_complete(request: Request):
    """Webhook for completed inbound calls → Daily Check-in Agent."""
    body = await request.json()
    logger.info("Webhook received (inbound): call_id=%s", body.get("call_id"))

    call_id = body.get("call_id", "")
    transcript = body.get("concatenated_transcript", "") or body.get("transcript", "")
    from_number = body.get("from", "") or body.get("caller_phone", "")

    if not from_number:
        return {"status": "ignored", "reason": "no caller number"}

    db = get_db()
    senior_record = db.get("seniors", from_number)
    senior_name = senior_record.get("name", "") if senior_record else ""

    return await process_checkin_result(from_number, call_id, transcript, senior_name)


@router.post("/bland/onboarding-complete")
async def onboarding_complete(request: Request):
    """Webhook for completed onboarding calls → Onboarding Agent."""
    body = await request.json()
    logger.info("Webhook received (onboarding): call_id=%s", body.get("call_id"))

    transcript = body.get("concatenated_transcript", "") or body.get("transcript", "")
    if not transcript:
        return {"status": "error", "reason": "no transcript"}

    # Extract senior info from transcript
    data = process_onboarding_transcript(transcript)

    # Create the senior profile
    senior = create_senior_from_onboarding(data)
    if senior:
        return {"status": "onboarded", "agent": "onboarding", "senior": senior.model_dump()}

    return {"status": "incomplete", "reason": "could not extract senior info", "extracted": data}


@router.post("/bland/notification-complete")
async def notification_complete(request: Request):
    """Webhook for completed notification calls → Scheduling Agent."""
    body = await request.json()
    logger.info("Webhook received (notification): call_id=%s", body.get("call_id"))
    return {"status": "acknowledged", "agent": "notification"}


@router.post("/bland/mock-complete")
async def mock_call_complete(request: Request):
    """Mock endpoint for testing."""
    body = await request.json()
    call_id = body.get("call_id", "")
    transcript = body.get("transcript", "I'm feeling good today. Yes I took my medications.")

    fake_payload = {"call_id": call_id, "concatenated_transcript": transcript, "status": "completed"}

    class FakeRequest:
        async def json(self):
            return fake_payload

    return await bland_call_complete(FakeRequest())
