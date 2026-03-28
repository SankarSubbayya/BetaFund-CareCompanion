"""CRUD endpoints for senior profiles."""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.database import get_db
from app.models.senior import Senior, SeniorUpdate
from app.services.scheduler import schedule_senior, remove_senior

router = APIRouter(prefix="/api/seniors", tags=["seniors"])


@router.post("", status_code=201)
async def create_senior(senior: Senior, _user: dict = Depends(verify_token)):
    db = get_db()
    if db.get("seniors", senior.phone):
        raise HTTPException(status_code=409, detail="Senior with this phone already exists")
    db.put("seniors", senior.phone, senior.model_dump())
    schedule_senior(senior)
    return senior


@router.get("")
async def list_seniors(_user: dict = Depends(verify_token)):
    db = get_db()
    return db.scan("seniors")


@router.get("/{phone}")
async def get_senior(phone: str, _user: dict = Depends(verify_token)):
    db = get_db()
    record = db.get("seniors", phone)
    if not record:
        raise HTTPException(status_code=404, detail="Senior not found")
    return record


@router.put("/{phone}")
async def update_senior(phone: str, update: SeniorUpdate, _user: dict = Depends(verify_token)):
    db = get_db()
    record = db.get("seniors", phone)
    if not record:
        raise HTTPException(status_code=404, detail="Senior not found")

    for field, value in update.model_dump(exclude_none=True).items():
        record[field] = value

    db.put("seniors", phone, record)
    senior = Senior(**record)
    schedule_senior(senior)
    return record


@router.delete("/{phone}")
async def delete_senior(phone: str, _user: dict = Depends(verify_token)):
    db = get_db()
    if not db.delete("seniors", phone):
        raise HTTPException(status_code=404, detail="Senior not found")
    remove_senior(phone)
    return {"status": "deleted"}
