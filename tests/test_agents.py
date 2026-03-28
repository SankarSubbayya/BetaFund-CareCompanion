"""Integration tests for agent flows."""

import pytest
from app.database import get_db
from app.models.senior import Senior
from app.models.checkin import CheckIn
from app.agents.daily_checkin import process_checkin_result
from app.agents.onboarding import process_onboarding_transcript, create_senior_from_onboarding
from app.agents.scheduling import schedule_appointment, update_checkin_schedule, get_appointments


@pytest.fixture(autouse=True)
def setup_test_senior():
    """Add a test senior to the database before each test."""
    db = get_db()
    db.put("seniors", "+19995551234", {
        "name": "Test Senior",
        "phone": "+19995551234",
        "medications": ["Aspirin"],
        "checkin_schedule": "09:00",
        "notes": "",
        "emergency_contacts": [{"name": "Family", "phone": "+19995559999", "relation": "daughter"}],
    })


class TestDailyCheckinAgent:
    @pytest.mark.asyncio
    async def test_process_happy_checkin(self):
        result = await process_checkin_result(
            senior_phone="+19995551234",
            call_id="test_call_happy",
            transcript="I'm feeling good today! Yes I took my pills.",
            senior_name="Test Senior",
        )
        assert result["status"] == "processed"
        assert result["agent"] == "daily_checkin"

    @pytest.mark.asyncio
    async def test_process_concerning_checkin(self):
        result = await process_checkin_result(
            senior_phone="+19995551234",
            call_id="test_call_concern",
            transcript="I fell yesterday and my hip hurts badly.",
            senior_name="Test Senior",
        )
        assert result["status"] == "processed"
        assert result["alerts"] >= 1  # fall at minimum

    @pytest.mark.asyncio
    async def test_process_service_request(self):
        result = await process_checkin_result(
            senior_phone="+19995551234",
            call_id="test_call_svc",
            transcript="I need help with my shower and I'm hungry, can't cook.",
            senior_name="Test Senior",
        )
        assert result["status"] == "processed"
        assert result["service_requests"] >= 2

    @pytest.mark.asyncio
    async def test_checkin_stored_in_db(self):
        await process_checkin_result(
            senior_phone="+19995551234",
            call_id="test_store",
            transcript="Feeling fine today.",
            senior_name="Test Senior",
        )
        db = get_db()
        checkins = db.scan_prefix("checkins", "+19995551234")
        assert len(checkins) >= 1


class TestOnboardingAgent:
    def test_extract_phone_from_transcript(self):
        transcript = "The senior's name is Mary. Her phone number is 415-555-1234. She takes Metformin 500mg and Lisinopril. Let's do check-ins at 9 am."
        data = process_onboarding_transcript(transcript)
        assert data["senior_phone"] == "+14155551234"
        assert len(data["medications"]) >= 1
        assert data["checkin_schedule"] == "09:00"

    def test_extract_relationship(self):
        transcript = "I'm her daughter. My name is Sarah."
        data = process_onboarding_transcript(transcript)
        assert data["emergency_contact_relation"] == "daughter"

    def test_extract_time_pm(self):
        transcript = "Let's do 2 pm for the calls."
        data = process_onboarding_transcript(transcript)
        assert data["checkin_schedule"] == "14:00"

    def test_create_senior_from_data(self):
        data = {
            "senior_name": "Mary Smith",
            "senior_phone": "+14155559999",
            "medications": ["Aspirin"],
            "checkin_schedule": "10:00",
            "emergency_contact_name": "Sarah",
            "emergency_contact_phone": "+14155558888",
            "emergency_contact_relation": "daughter",
            "notes": "",
        }
        senior = create_senior_from_onboarding(data)
        assert senior is not None
        assert senior.name == "Mary Smith"
        assert senior.phone == "+14155559999"

        db = get_db()
        stored = db.get("seniors", "+14155559999")
        assert stored is not None

    def test_create_senior_no_phone_returns_none(self):
        data = {"senior_name": "Nobody", "senior_phone": ""}
        senior = create_senior_from_onboarding(data)
        assert senior is None


class TestSchedulingAgent:
    @pytest.mark.asyncio
    async def test_schedule_appointment(self):
        result = await schedule_appointment(
            senior_phone="+19995551234",
            appointment_type="Doctor visit",
            date="2026-04-01",
            time="14:00",
            notes="Annual checkup",
        )
        assert result["status"] == "scheduled"
        assert result["agent"] == "scheduling"

    @pytest.mark.asyncio
    async def test_get_appointments(self):
        await schedule_appointment("+19995551234", "Doctor", "2026-04-01", "14:00")
        appts = get_appointments("+19995551234")
        assert len(appts) >= 1

    @pytest.mark.asyncio
    async def test_update_checkin_schedule(self):
        result = await update_checkin_schedule("+19995551234", "10:30")
        assert result["status"] == "updated"
        assert result["new_time"] == "10:30"

        db = get_db()
        senior = db.get("seniors", "+19995551234")
        assert senior["checkin_schedule"] == "10:30"

    @pytest.mark.asyncio
    async def test_update_nonexistent_senior(self):
        result = await update_checkin_schedule("+10000000000", "10:00")
        assert result["status"] == "error"
