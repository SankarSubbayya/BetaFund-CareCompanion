"""APScheduler-based daily check-in scheduler."""

from __future__ import annotations

import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import get_db
from app.models.senior import Senior

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def _run_checkin(phone: str) -> None:
    """Synchronous wrapper that triggers an async check-in call."""
    from app.services.bland_ai import initiate_checkin_call

    db = get_db()
    record = db.get("seniors", phone)
    if not record:
        logger.warning("Senior %s not found for scheduled check-in", phone)
        return

    senior = Senior(**record)

    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(initiate_checkin_call(senior))
    finally:
        loop.close()


def schedule_senior(senior: Senior) -> None:
    """Add or update a daily check-in job for a senior."""
    job_id = f"checkin_{senior.phone}"
    hour, minute = map(int, senior.checkin_schedule.split(":"))

    # Remove existing job if any
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    scheduler.add_job(
        _run_checkin,
        "cron",
        hour=hour,
        minute=minute,
        args=[senior.phone],
        id=job_id,
        replace_existing=True,
    )
    logger.info("Scheduled daily check-in for %s at %s", senior.name, senior.checkin_schedule)


def remove_senior(phone: str) -> None:
    """Remove a senior's scheduled check-in."""
    job_id = f"checkin_{phone}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)


def _run_monthly_reports() -> None:
    """Generate monthly reports for all seniors."""
    from app.agents.monthly_report import generate_all_reports
    reports = generate_all_reports()
    logger.info("Generated %d monthly reports", len(reports))


def start_scheduler() -> None:
    """Start the scheduler and load all existing seniors."""
    db = get_db()
    seniors = db.scan("seniors")
    for record in seniors:
        try:
            senior = Senior(**record)
            schedule_senior(senior)
        except Exception as e:
            logger.error("Failed to schedule senior: %s", e)

    # Monthly report job — runs on the 1st of each month at 8:00 AM
    if not scheduler.get_job("monthly_reports"):
        scheduler.add_job(
            _run_monthly_reports,
            "cron",
            day=1,
            hour=8,
            minute=0,
            id="monthly_reports",
            replace_existing=True,
        )
        logger.info("Scheduled monthly report generation for 1st of each month at 08:00")

    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")


def stop_scheduler() -> None:
    """Shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
