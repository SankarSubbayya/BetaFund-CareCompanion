"""Evaluate check-in data and generate alerts for concerns and service requests."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.database import get_db
from app.models.alert import Alert
from app.models.checkin import CheckIn

logger = logging.getLogger(__name__)


def evaluate_checkin(checkin: CheckIn, senior_name: str = "") -> list[Alert]:
    """Evaluate a check-in and return any alerts that should be raised."""
    alerts: list[Alert] = []
    now = datetime.now(timezone.utc).isoformat()
    who = senior_name or checkin.senior_phone

    # Critical: emergency concerns
    emergency_words = {"fall", "fell", "fallen", "chest pain", "can't breathe", "emergency", "stroke", "bleeding"}
    for concern in checkin.concerns:
        if concern.lower() in emergency_words:
            alerts.append(Alert(
                id=f"{checkin.senior_phone}:{now}:emergency",
                senior_phone=checkin.senior_phone,
                senior_name=senior_name,
                timestamp=now,
                alert_type="emergency",
                severity="critical",
                message=f"Emergency detected during check-in: {concern}. Immediate attention needed for {who}.",
            ))

    # High: low mood / low wellness
    if checkin.mood == "concerning" or checkin.wellness_score < 4:
        alerts.append(Alert(
            id=f"{checkin.senior_phone}:{now}:low_mood",
            senior_phone=checkin.senior_phone,
            senior_name=senior_name,
            timestamp=now,
            alert_type="low_mood",
            severity="high",
            message=f"{who} reported low mood (wellness score: {checkin.wellness_score}/10).",
        ))

    # Medium: missed medication
    if checkin.medication_taken is False:
        alerts.append(Alert(
            id=f"{checkin.senior_phone}:{now}:missed_medication",
            senior_phone=checkin.senior_phone,
            senior_name=senior_name,
            timestamp=now,
            alert_type="missed_medication",
            severity="medium",
            message=f"{who} has not taken their medications today.",
        ))

    # Medium: loneliness
    if "loneliness" in checkin.concerns:
        alerts.append(Alert(
            id=f"{checkin.senior_phone}:{now}:loneliness",
            senior_phone=checkin.senior_phone,
            senior_name=senior_name,
            timestamp=now,
            alert_type="loneliness",
            severity="medium",
            message=f"{who} expressed feelings of loneliness.",
        ))

    # Service request alerts
    for svc in checkin.service_requests:
        svc_type = svc.get("type", "other")
        svc_label = svc.get("label", svc_type)
        urgency = svc.get("urgency", "normal")

        if svc_type == "medical_emergency":
            severity = "critical"
        elif urgency == "urgent":
            severity = "high"
        else:
            severity = "medium"

        alerts.append(Alert(
            id=f"{checkin.senior_phone}:{now}:service_{svc_type}",
            senior_phone=checkin.senior_phone,
            senior_name=senior_name,
            timestamp=now,
            alert_type=f"service_request",
            severity=severity,
            message=f"{who} requested help: {svc_label}. {svc.get('details', '')}",
        ))

    # Store alerts
    db = get_db()
    for alert in alerts:
        db.put("alerts", alert.id, alert.model_dump())
        logger.warning("ALERT [%s] %s: %s", alert.severity.upper(), alert.alert_type, alert.message)

    return alerts
