from pydantic import BaseModel


class Alert(BaseModel):
    id: str
    senior_phone: str
    senior_name: str = ""
    timestamp: str
    alert_type: str  # missed_medication, low_mood, no_answer, emergency, fall
    severity: str  # low, medium, high, critical
    message: str
    acknowledged: bool = False
