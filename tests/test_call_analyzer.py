"""Unit tests for call_analyzer — transcript mood, wellness, medication, and service detection."""

from app.services.call_analyzer import analyze_transcript, detect_service_requests


class TestMoodDetection:
    def test_happy_mood(self):
        result = analyze_transcript("I'm feeling great today! Everything is wonderful and lovely.")
        assert result["mood"] == "happy"

    def test_sad_mood(self):
        result = analyze_transcript("I'm feeling bad and tired. Everything is terrible.")
        assert result["mood"] in ("sad", "concerning")

    def test_concerning_mood(self):
        result = analyze_transcript("I'm sick and confused and dizzy and weak and depressed.")
        assert result["mood"] == "concerning"

    def test_neutral_mood(self):
        result = analyze_transcript("Yes I took my pills today.")
        assert result["mood"] == "neutral"

    def test_empty_transcript(self):
        result = analyze_transcript("")
        assert result["mood"] == "unknown"
        assert result["wellness_score"] == 5


class TestWellnessScore:
    def test_high_score_positive(self):
        result = analyze_transcript("I'm feeling great, wonderful, excellent, fantastic!")
        assert result["wellness_score"] >= 7

    def test_low_score_negative(self):
        result = analyze_transcript("I'm in pain, feeling terrible, sick and confused.")
        assert result["wellness_score"] <= 4

    def test_score_range(self):
        result = analyze_transcript("Just a normal day.")
        assert 1 <= result["wellness_score"] <= 10


class TestMedicationCompliance:
    def test_took_medication(self):
        result = analyze_transcript("Yes I took my medications this morning already.")
        assert result["medication_taken"] is True

    def test_forgot_medication(self):
        result = analyze_transcript("I forgot to take my pills. I missed them today.")
        assert result["medication_taken"] is False

    def test_unknown_medication(self):
        result = analyze_transcript("It's a nice day outside.")
        assert result["medication_taken"] is None


class TestConcernDetection:
    def test_fall_detection(self):
        result = analyze_transcript("I fell in the bathroom yesterday.")
        assert "fell" in result["concerns"]

    def test_chest_pain(self):
        result = analyze_transcript("I'm having chest pain.")
        assert "chest pain" in result["concerns"]

    def test_loneliness(self):
        result = analyze_transcript("I've been feeling so lonely lately.")
        assert "loneliness" in result["concerns"]

    def test_confusion(self):
        result = analyze_transcript("I'm very confused about things.")
        assert "possible confusion" in result["concerns"]

    def test_no_concerns(self):
        result = analyze_transcript("Everything is fine today!")
        assert result["concerns"] == []


class TestServiceRequestDetection:
    def test_shower_help(self):
        requests = detect_service_requests("I need help with my shower today.")
        types = [r["type"] for r in requests]
        assert "shower_help" in types

    def test_food_help(self):
        requests = detect_service_requests("I'm hungry and can't cook anything.")
        types = [r["type"] for r in requests]
        assert "food_order" in types

    def test_medicine_need(self):
        requests = detect_service_requests("I need to refill my prescription at the pharmacy.")
        types = [r["type"] for r in requests]
        assert "medicine_need" in types

    def test_mail_help(self):
        requests = detect_service_requests("Can someone check my mail for me?")
        types = [r["type"] for r in requests]
        assert "mail_help" in types

    def test_transportation(self):
        requests = detect_service_requests("I need a ride to my doctor appointment.")
        types = [r["type"] for r in requests]
        assert "transportation" in types

    def test_medical_emergency(self):
        requests = detect_service_requests("I'm having chest pain and can't breathe.")
        types = [r["type"] for r in requests]
        assert "medical_emergency" in types

    def test_companionship(self):
        requests = detect_service_requests("I'm so lonely, nobody visits me.")
        types = [r["type"] for r in requests]
        assert "companionship" in types

    def test_no_service_requests(self):
        requests = detect_service_requests("I'm doing fine today, took my meds.")
        assert len(requests) == 0

    def test_multiple_requests(self):
        requests = detect_service_requests("I need help with my shower and I'm hungry.")
        types = [r["type"] for r in requests]
        assert "shower_help" in types
        assert "food_order" in types


class TestAnalyzerSummary:
    def test_summary_includes_mood(self):
        result = analyze_transcript("I'm feeling great!")
        assert "Mood:" in result["summary"]

    def test_summary_includes_meds_taken(self):
        result = analyze_transcript("Yes I took my medications.")
        assert "Medications taken" in result["summary"]

    def test_summary_includes_meds_missed(self):
        result = analyze_transcript("I forgot my medications.")
        assert "NOT taken" in result["summary"]

    def test_summary_includes_service_requests(self):
        result = analyze_transcript("I need help with my shower.")
        assert "Service requests" in result["summary"]
