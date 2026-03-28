from pydantic import BaseModel


class ServiceRequest(BaseModel):
    type: str  # shower_help, medicine_need, grocery_help, transportation, other
    details: str = ""
    urgency: str = "normal"  # normal, urgent


class CheckIn(BaseModel):
    senior_phone: str
    call_id: str
    timestamp: str
    transcript: str = ""
    mood: str = ""  # happy, neutral, sad, concerning
    wellness_score: int = 0  # 1-10
    medication_taken: bool | None = None
    concerns: list[str] = []
    service_requests: list[dict] = []
    summary: str = ""
