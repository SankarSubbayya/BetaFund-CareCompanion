from pydantic import BaseModel


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str


class Senior(BaseModel):
    name: str
    phone: str  # E.164 format
    medications: list[str] = []
    emergency_contacts: list[EmergencyContact] = []
    checkin_schedule: str = "09:00"  # daily HH:MM
    notes: str = ""


class SeniorUpdate(BaseModel):
    name: str | None = None
    medications: list[str] | None = None
    emergency_contacts: list[EmergencyContact] | None = None
    checkin_schedule: str | None = None
    notes: str | None = None
