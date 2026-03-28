"""
Daily Check-in Agent — Conducts daily wellness calls with seniors.

Responsibilities:
- Build personalized call prompts with EverMind memory
- Initiate outbound calls via Bland AI
- Process call results (mood, meds, service requests)
- Trigger alerts and service recommendations
- Store memories for future calls

This agent orchestrates: bland_ai.py, call_analyzer.py, alert_engine.py, memory.py
"""

from __future__ import annotations

import logging

from app.database import get_db
from app.models.senior import Senior
from app.services.bland_ai import initiate_checkin_call
from app.services.call_analyzer import analyze_transcript
from app.services.alert_engine import evaluate_checkin
from app.services.memory import store_memory
from app.services.service_directory import find_services
from app.models.checkin import CheckIn

logger = logging.getLogger(__name__)


async def run_checkin(senior_phone: str) -> dict:
    """Execute a full check-in cycle for a senior."""
    db = get_db()
    record = db.get("seniors", senior_phone)
    if not record:
        return {"status": "error", "reason": "senior not found"}

    senior = Senior(**record)
    logger.info("[DailyCheckinAgent] Starting check-in for %s", senior.name)

    # Step 1: Initiate the call (memories are recalled inside initiate_checkin_call)
    result = await initiate_checkin_call(senior)

    logger.info("[DailyCheckinAgent] Call initiated for %s — call_id: %s",
                senior.name, result.get("call_id"))

    return {
        "status": "call_initiated",
        "agent": "daily_checkin",
        "senior": senior.name,
        "call_id": result.get("call_id"),
    }


async def process_checkin_result(
    senior_phone: str,
    call_id: str,
    transcript: str,
    senior_name: str = "",
) -> dict:
    """Process a completed check-in call — analyze, alert, remember."""
    from datetime import datetime, timezone

    logger.info("[DailyCheckinAgent] Processing call %s for %s", call_id, senior_name or senior_phone)

    now = datetime.now(timezone.utc).isoformat()
    db = get_db()

    # Step 1: Analyze transcript
    analysis = analyze_transcript(transcript)

    # Step 2: Create check-in record
    checkin = CheckIn(
        senior_phone=senior_phone,
        call_id=call_id,
        timestamp=now,
        transcript=transcript,
        mood=analysis["mood"],
        wellness_score=analysis["wellness_score"],
        medication_taken=analysis["medication_taken"],
        concerns=analysis["concerns"],
        service_requests=analysis["service_requests"],
        summary=analysis["summary"],
    )

    # Step 3: Store check-in
    checkin_key = f"{senior_phone}:{now}"
    db.put("checkins", checkin_key, checkin.model_dump())

    # Step 4: Evaluate alerts
    alerts = evaluate_checkin(checkin, senior_name)

    # Step 5: Match service recommendations
    for svc in checkin.service_requests:
        services = find_services(svc["type"])
        if services:
            db.put("service_recommendations", f"{senior_phone}:{now}:services_{svc['type']}", {
                "senior_phone": senior_phone,
                "senior_name": senior_name,
                "request_type": svc["type"],
                "label": svc["label"],
                "timestamp": now,
                "recommended_services": services,
            })

    # Step 6: Store memory in EverMind
    memory_summary = f"Check-in with {senior_name or senior_phone}: {checkin.summary}"
    if checkin.concerns:
        memory_summary += f" Concerns: {', '.join(checkin.concerns)}"
    if checkin.service_requests:
        svc_labels = [s.get("label", s.get("type", "")) for s in checkin.service_requests]
        memory_summary += f" Requested: {', '.join(svc_labels)}"
    await store_memory(senior_phone, memory_summary, call_id)

    # Step 7: Trigger family notification for critical/high alerts
    critical_alerts = [a for a in alerts if a.severity in ("critical", "high")]
    if critical_alerts:
        from app.agents.scheduling import notify_family
        for alert in critical_alerts:
            await notify_family(alert)
            logger.info("[DailyCheckinAgent] Notified family about %s alert for %s",
                        alert.severity, senior_name)

    logger.info("[DailyCheckinAgent] Completed processing for %s — %d alerts, %d service requests",
                senior_name or senior_phone, len(alerts), len(checkin.service_requests))

    return {
        "status": "processed",
        "agent": "daily_checkin",
        "checkin_key": checkin_key,
        "alerts": len(alerts),
        "service_requests": len(checkin.service_requests),
        "family_notified": len(critical_alerts) > 0,
    }
