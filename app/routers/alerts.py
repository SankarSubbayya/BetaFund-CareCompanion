"""Alert listing and acknowledgment endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.database import get_db

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def get_alerts(acknowledged: bool = False, _user: dict = Depends(verify_token)):
    """Get all alerts, optionally filtered by acknowledged status."""
    db = get_db()
    alerts = db.scan("alerts")
    if not acknowledged:
        alerts = [a for a in alerts if not a.get("acknowledged", False)]
    alerts.sort(key=lambda a: a.get("timestamp", ""), reverse=True)
    return alerts


@router.get("/{phone}")
async def get_alerts_for_senior(phone: str, _user: dict = Depends(verify_token)):
    """Get alerts for a specific senior."""
    db = get_db()
    alerts = db.scan_prefix("alerts", phone)
    alerts.sort(key=lambda a: a.get("timestamp", ""), reverse=True)
    return alerts


@router.put("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, _user: dict = Depends(verify_token)):
    """Mark an alert as acknowledged."""
    db = get_db()
    alert = db.get("alerts", alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["acknowledged"] = True
    db.put("alerts", alert_id, alert)
    return alert
