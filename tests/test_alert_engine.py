"""Unit tests for alert_engine — alert generation from check-in data."""

from app.services.alert_engine import evaluate_checkin
from app.models.checkin import CheckIn
from app.database import get_db


def _make_checkin(**kwargs) -> CheckIn:
    defaults = {
        "senior_phone": "+14155551001",
        "call_id": "test_call",
        "timestamp": "2026-03-28T10:00:00Z",
        "mood": "neutral",
        "wellness_score": 6,
        "medication_taken": True,
        "concerns": [],
        "service_requests": [],
        "summary": "Test check-in",
    }
    defaults.update(kwargs)
    return CheckIn(**defaults)


class TestEmergencyAlerts:
    def test_fall_triggers_critical(self):
        checkin = _make_checkin(concerns=["fell"])
        alerts = evaluate_checkin(checkin, "Test Senior")
        critical = [a for a in alerts if a.severity == "critical"]
        assert len(critical) >= 1
        assert critical[0].alert_type == "emergency"

    def test_chest_pain_triggers_critical(self):
        checkin = _make_checkin(concerns=["chest pain"])
        alerts = evaluate_checkin(checkin, "Test Senior")
        critical = [a for a in alerts if a.severity == "critical"]
        assert len(critical) >= 1

    def test_bleeding_triggers_critical(self):
        checkin = _make_checkin(concerns=["bleeding"])
        alerts = evaluate_checkin(checkin, "Test Senior")
        critical = [a for a in alerts if a.severity == "critical"]
        assert len(critical) >= 1


class TestMoodAlerts:
    def test_concerning_mood_triggers_high(self):
        checkin = _make_checkin(mood="concerning", wellness_score=3)
        alerts = evaluate_checkin(checkin, "Test Senior")
        high = [a for a in alerts if a.alert_type == "low_mood"]
        assert len(high) == 1
        assert high[0].severity == "high"

    def test_low_wellness_triggers_high(self):
        checkin = _make_checkin(wellness_score=2)
        alerts = evaluate_checkin(checkin, "Test Senior")
        high = [a for a in alerts if a.alert_type == "low_mood"]
        assert len(high) == 1

    def test_normal_mood_no_alert(self):
        checkin = _make_checkin(mood="happy", wellness_score=8)
        alerts = evaluate_checkin(checkin, "Test Senior")
        mood_alerts = [a for a in alerts if a.alert_type == "low_mood"]
        assert len(mood_alerts) == 0


class TestMedicationAlerts:
    def test_missed_meds_triggers_medium(self):
        checkin = _make_checkin(medication_taken=False)
        alerts = evaluate_checkin(checkin, "Test Senior")
        med_alerts = [a for a in alerts if a.alert_type == "missed_medication"]
        assert len(med_alerts) == 1
        assert med_alerts[0].severity == "medium"

    def test_taken_meds_no_alert(self):
        checkin = _make_checkin(medication_taken=True)
        alerts = evaluate_checkin(checkin, "Test Senior")
        med_alerts = [a for a in alerts if a.alert_type == "missed_medication"]
        assert len(med_alerts) == 0


class TestLonelinessAlerts:
    def test_loneliness_triggers_medium(self):
        checkin = _make_checkin(concerns=["loneliness"])
        alerts = evaluate_checkin(checkin, "Test Senior")
        lonely = [a for a in alerts if a.alert_type == "loneliness"]
        assert len(lonely) == 1


class TestServiceRequestAlerts:
    def test_service_request_creates_alert(self):
        checkin = _make_checkin(service_requests=[
            {"type": "shower_help", "label": "Shower Help", "details": "test", "urgency": "normal"}
        ])
        alerts = evaluate_checkin(checkin, "Test Senior")
        svc = [a for a in alerts if a.alert_type == "service_request"]
        assert len(svc) == 1
        assert "Shower Help" in svc[0].message

    def test_medical_emergency_service_is_critical(self):
        checkin = _make_checkin(service_requests=[
            {"type": "medical_emergency", "label": "Medical Emergency", "details": "test", "urgency": "critical"}
        ])
        alerts = evaluate_checkin(checkin, "Test Senior")
        svc = [a for a in alerts if a.alert_type == "service_request"]
        assert len(svc) == 1
        assert svc[0].severity == "critical"

    def test_multiple_service_requests(self):
        checkin = _make_checkin(service_requests=[
            {"type": "shower_help", "label": "Shower", "details": "", "urgency": "normal"},
            {"type": "food_order", "label": "Food", "details": "", "urgency": "normal"},
        ])
        alerts = evaluate_checkin(checkin, "Test Senior")
        svc = [a for a in alerts if a.alert_type == "service_request"]
        assert len(svc) == 2


class TestNoAlerts:
    def test_healthy_checkin_no_alerts(self):
        checkin = _make_checkin(mood="happy", wellness_score=8, medication_taken=True)
        alerts = evaluate_checkin(checkin, "Test Senior")
        assert len(alerts) == 0


class TestAlertStorage:
    def test_alerts_stored_in_db(self):
        checkin = _make_checkin(concerns=["fell"], medication_taken=False)
        alerts = evaluate_checkin(checkin, "Test Senior")
        db = get_db()
        stored = db.scan("alerts")
        assert len(stored) >= len(alerts)
