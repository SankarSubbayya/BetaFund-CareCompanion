"""API routes for the three CareCompanion agents."""

from fastapi import APIRouter, Depends

from app.auth import verify_token
from app.database import get_db
from app.agents.onboarding import start_onboarding_call
from app.agents.scheduling import (
    schedule_appointment,
    update_checkin_schedule,
    get_appointments,
)
from app.agents.daily_checkin import run_checkin

router = APIRouter(prefix="/api/agents", tags=["agents"])


# ── Onboarding Agent ──

@router.post("/onboarding/call")
async def trigger_onboarding(phone: str, _user: dict = Depends(verify_token)):
    """Call a family member to onboard a new senior."""
    return await start_onboarding_call(phone)


# ── Daily Check-in Agent ──

@router.post("/checkin/{phone}")
async def trigger_checkin(phone: str, _user: dict = Depends(verify_token)):
    """Trigger a daily check-in call for a senior."""
    return await run_checkin(phone)


# ── Scheduling & Notification Agent ──

@router.post("/schedule/appointment")
async def create_appointment(
    senior_phone: str,
    appointment_type: str,
    date: str,
    time: str,
    notes: str = "",
    _user: dict = Depends(verify_token),
):
    """Schedule an appointment for a senior."""
    return await schedule_appointment(senior_phone, appointment_type, date, time, notes)


@router.get("/schedule/appointments/{phone}")
async def list_appointments(phone: str, _user: dict = Depends(verify_token)):
    """List appointments for a senior."""
    return get_appointments(phone)


@router.put("/schedule/checkin-time/{phone}")
async def change_checkin_time(phone: str, new_time: str, _user: dict = Depends(verify_token)):
    """Update a senior's daily check-in time."""
    return await update_checkin_schedule(phone, new_time)


# ── Agent Status ──

@router.get("/status")
async def agent_status(_user: dict = Depends(verify_token)):
    """Get status of all three agents."""
    db = get_db()
    seniors = db.scan("seniors")
    notifications = db.scan("notifications")

    return {
        "agents": [
            {
                "name": "Onboarding Agent",
                "description": "Registers new seniors via voice call",
                "status": "active",
                "endpoint": "/api/agents/onboarding/call",
            },
            {
                "name": "Daily Check-in Agent",
                "description": "Conducts daily wellness calls with memory",
                "status": "active",
                "seniors_monitored": len(seniors),
                "endpoint": "/api/agents/checkin/{phone}",
            },
            {
                "name": "Scheduling & Notification Agent",
                "description": "Manages appointments and notifies family",
                "status": "active",
                "notifications_sent": len(notifications),
                "endpoint": "/api/agents/schedule/*",
            },
        ]
    }
