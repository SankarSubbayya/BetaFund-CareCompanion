"""Check-in history and manual call trigger endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.database import get_db
from app.models.senior import Senior
from app.services.bland_ai import initiate_checkin_call

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.get("/{phone}")
async def get_checkins(phone: str, _user: dict = Depends(verify_token)):
    """Get all check-ins for a senior."""
    db = get_db()
    checkins = db.scan_prefix("checkins", phone)
    # Sort by timestamp descending
    checkins.sort(key=lambda c: c.get("timestamp", ""), reverse=True)
    return checkins


@router.get("")
async def get_all_checkins(_user: dict = Depends(verify_token)):
    """Get all check-ins across all seniors."""
    db = get_db()
    checkins = db.scan("checkins")
    checkins.sort(key=lambda c: c.get("timestamp", ""), reverse=True)
    return checkins


@router.post("/trigger/{phone}")
async def trigger_checkin(phone: str, _user: dict = Depends(verify_token)):
    """Manually trigger a check-in call for a senior."""
    db = get_db()
    record = db.get("seniors", phone)
    if not record:
        raise HTTPException(status_code=404, detail="Senior not found")

    senior = Senior(**record)
    result = await initiate_checkin_call(senior)
    return result


@router.get("/latest/all")
async def get_latest_checkins(_user: dict = Depends(verify_token)):
    """Get the most recent check-in for each senior."""
    db = get_db()
    all_checkins = db.scan("checkins")

    # Group by phone and take latest
    latest: dict[str, dict] = {}
    for checkin in all_checkins:
        phone = checkin.get("senior_phone", "")
        if phone not in latest or checkin.get("timestamp", "") > latest[phone].get("timestamp", ""):
            latest[phone] = checkin

    return list(latest.values())
