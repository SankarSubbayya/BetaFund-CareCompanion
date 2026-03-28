from enum import Enum
from pydantic import BaseModel


class UserRole(str, Enum):
    caregiver = "caregiver"  # Doctor, Nurse
    patient = "patient"  # Senior, Disability
    emergency_contact = "emergency_contact"  # Family, Friends


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str  # e.g. daughter, friend, neighbor
    role: UserRole = UserRole.emergency_contact


class Caregiver(BaseModel):
    name: str
    phone: str
    type: str = ""  # e.g. doctor, nurse
    role: UserRole = UserRole.caregiver


class Senior(BaseModel):
    name: str
    phone: str  # E.164 format
    role: UserRole = UserRole.patient
    patient_type: str = "senior"  # senior or disability
    medications: list[str] = []
    emergency_contacts: list[EmergencyContact] = []
    caregivers: list[Caregiver] = []
    checkin_schedule: str = "09:00"  # daily HH:MM
    notes: str = ""


class SeniorUpdate(BaseModel):
    name: str | None = None
    patient_type: str | None = None
    medications: list[str] | None = None
    emergency_contacts: list[EmergencyContact] | None = None
    caregivers: list[Caregiver] | None = None
    checkin_schedule: str | None = None
    notes: str | None = None
