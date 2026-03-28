"""Integration tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_senior():
    return {
        "name": "Test Senior",
        "phone": "+19995551234",
        "medications": ["Aspirin 81mg", "Vitamin D"],
        "checkin_schedule": "09:00",
        "notes": "Test patient",
        "emergency_contacts": [{"name": "Test Contact", "phone": "+19995554321", "relation": "daughter"}],
    }


class TestSeniorsAPI:
    def test_create_senior(self, client):
        senior = {
            "name": "Unique Senior",
            "phone": f"+1999{__import__('random').randint(1000000, 9999999)}",
            "medications": ["Aspirin"],
            "checkin_schedule": "09:00",
            "notes": "",
            "emergency_contacts": [],
        }
        resp = client.post("/api/seniors", json=senior)
        assert resp.status_code == 201
        assert resp.json()["name"] == "Unique Senior"

    def test_create_duplicate_senior(self, client, sample_senior):
        # Ensure it exists first
        client.post("/api/seniors", json=sample_senior)
        resp = client.post("/api/seniors", json=sample_senior)
        assert resp.status_code == 409

    def test_list_seniors(self, client, sample_senior):
        client.post("/api/seniors", json=sample_senior)
        resp = client.get("/api/seniors")
        assert resp.status_code == 200
        seniors = resp.json()
        assert len(seniors) >= 1

    def test_get_senior(self, client, sample_senior):
        client.post("/api/seniors", json=sample_senior)
        resp = client.get("/api/seniors/+19995551234")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Senior"

    def test_get_nonexistent_senior(self, client):
        resp = client.get("/api/seniors/+10000000000")
        assert resp.status_code == 404

    def test_update_senior(self, client, sample_senior):
        client.post("/api/seniors", json=sample_senior)
        resp = client.put("/api/seniors/+19995551234", json={"notes": "Updated notes"})
        assert resp.status_code == 200
        assert resp.json()["notes"] == "Updated notes"

    def test_delete_senior(self, client, sample_senior):
        client.post("/api/seniors", json=sample_senior)
        resp = client.delete("/api/seniors/+19995551234")
        assert resp.status_code == 200
        resp = client.get("/api/seniors/+19995551234")
        assert resp.status_code == 404


class TestAlertsAPI:
    def test_get_alerts_empty(self, client):
        resp = client.get("/api/alerts")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestCheckinsAPI:
    def test_get_checkins_empty(self, client):
        resp = client.get("/api/checkins")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_trigger_checkin_nonexistent(self, client):
        resp = client.post("/api/checkins/trigger/+10000000000")
        assert resp.status_code == 404


class TestServicesAPI:
    def test_get_all_services(self, client):
        resp = client.get("/api/services")
        assert resp.status_code == 200
        data = resp.json()
        assert "shower_help" in data
        assert "medical_emergency" in data

    def test_get_211_info(self, client):
        resp = client.get("/api/services/211")
        assert resp.status_code == 200
        assert resp.json()["phone"] == "211"

    def test_get_services_by_type(self, client):
        resp = client.get("/api/services/food_order")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "food_order"
        assert len(data["services"]) >= 1


class TestAgentsAPI:
    def test_agent_status(self, client):
        resp = client.get("/api/agents/status")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["agents"]) == 3
        names = [a["name"] for a in data["agents"]]
        assert "Onboarding Agent" in names
        assert "Daily Check-in Agent" in names
        assert "Scheduling & Notification Agent" in names


class TestDashboard:
    def test_dashboard_serves_html(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "CareCompanion" in resp.text
