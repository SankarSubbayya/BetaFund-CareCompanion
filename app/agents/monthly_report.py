"""
Monthly Report Agent — Generates monthly wellness reports for each senior.

Responsibilities:
- Aggregate check-in data over the past month
- Track mood trends, medication adherence, alert history
- Summarize service requests and concerns
- Provide actionable insights for family members
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from collections import Counter

from app.database import get_db
from app.models.senior import Senior

logger = logging.getLogger(__name__)


def generate_monthly_report(senior_phone: str) -> dict:
    """Generate a monthly wellness report for a senior."""
    db = get_db()
    record = db.get("seniors", senior_phone)
    if not record:
        return {"status": "error", "reason": "senior not found"}

    senior = Senior(**record)
    now = datetime.now(timezone.utc)
    month_ago = (now - timedelta(days=30)).isoformat()

    # Gather check-ins from the past 30 days
    all_checkins = db.scan_prefix("checkins", senior_phone)
    checkins = [c for c in all_checkins if c.get("timestamp", "") >= month_ago]

    # Gather alerts from the past 30 days
    all_alerts = db.scan_prefix("alerts", senior_phone)
    alerts = [a for a in all_alerts if a.get("timestamp", "") >= month_ago]

    # Gather service recommendations
    all_services = db.scan_prefix("service_recommendations", senior_phone)
    service_recs = [s for s in all_services if s.get("timestamp", "") >= month_ago]

    if not checkins:
        return {
            "status": "generated",
            "agent": "monthly_report",
            "senior": senior.name,
            "senior_phone": senior_phone,
            "period": {"from": month_ago, "to": now.isoformat()},
            "total_checkins": 0,
            "summary": f"No check-ins recorded for {senior.name} in the past 30 days.",
        }

    # Mood analysis
    moods = [c.get("mood", "unknown") for c in checkins]
    mood_counts = dict(Counter(moods))
    most_common_mood = max(mood_counts, key=mood_counts.get)

    # Wellness score trend
    scores = [c.get("wellness_score", 0) for c in checkins if c.get("wellness_score") is not None]
    avg_wellness = round(sum(scores) / len(scores), 1) if scores else 0
    min_wellness = min(scores) if scores else 0
    max_wellness = max(scores) if scores else 0

    # Medication adherence
    med_taken = sum(1 for c in checkins if c.get("medication_taken"))
    med_total = len(checkins)
    med_adherence_pct = round((med_taken / med_total) * 100, 1) if med_total > 0 else 0

    # Concerns
    all_concerns = []
    for c in checkins:
        all_concerns.extend(c.get("concerns", []))
    concern_counts = dict(Counter(all_concerns))

    # Service requests
    all_svc_types = []
    for c in checkins:
        for svc in c.get("service_requests", []):
            all_svc_types.append(svc.get("type", svc.get("label", "unknown")))
    service_counts = dict(Counter(all_svc_types))

    # Alert summary
    alert_severities = dict(Counter(a.get("severity", "unknown") for a in alerts))
    alert_types = dict(Counter(a.get("alert_type", "unknown") for a in alerts))

    # Build summary text
    summary_parts = [
        f"{senior.name} had {len(checkins)} check-ins over the past 30 days.",
        f"Average wellness score: {avg_wellness}/10 (range: {min_wellness}-{max_wellness}).",
        f"Most common mood: {most_common_mood}.",
        f"Medication adherence: {med_adherence_pct}% ({med_taken}/{med_total} check-ins).",
    ]
    if alerts:
        summary_parts.append(f"{len(alerts)} alerts triggered: {alert_severities}.")
    if all_concerns:
        top_concerns = sorted(concern_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        summary_parts.append(f"Top concerns: {', '.join(c[0] for c in top_concerns)}.")
    if all_svc_types:
        summary_parts.append(f"Service requests: {service_counts}.")

    report = {
        "status": "generated",
        "agent": "monthly_report",
        "senior": senior.name,
        "senior_phone": senior_phone,
        "period": {"from": month_ago, "to": now.isoformat()},
        "total_checkins": len(checkins),
        "mood": {
            "distribution": mood_counts,
            "most_common": most_common_mood,
        },
        "wellness": {
            "average": avg_wellness,
            "min": min_wellness,
            "max": max_wellness,
            "scores": scores,
        },
        "medication": {
            "adherence_pct": med_adherence_pct,
            "taken": med_taken,
            "total": med_total,
        },
        "concerns": concern_counts,
        "service_requests": service_counts,
        "alerts": {
            "total": len(alerts),
            "by_severity": alert_severities,
            "by_type": alert_types,
        },
        "summary": " ".join(summary_parts),
    }

    # Store the report
    report_key = f"{senior_phone}:{now.strftime('%Y-%m')}"
    db.put("monthly_reports", report_key, report)

    logger.info("[MonthlyReportAgent] Generated report for %s — %d check-ins, %d alerts",
                senior.name, len(checkins), len(alerts))

    return report


def generate_all_reports() -> list[dict]:
    """Generate monthly reports for all seniors."""
    db = get_db()
    seniors = db.scan("seniors")
    reports = []
    for record in seniors:
        try:
            report = generate_monthly_report(record["phone"])
            reports.append(report)
        except Exception as e:
            logger.error("Failed to generate report for %s: %s", record.get("phone"), e)
    return reports
