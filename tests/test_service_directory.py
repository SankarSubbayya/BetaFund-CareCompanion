"""Unit tests for service_directory — provider lookup and 211 info."""

from app.services.service_directory import (
    find_services,
    find_all_services,
    get_211_info,
)


class TestFindServices:
    def test_shower_help_has_providers(self):
        services = find_services("shower_help")
        assert len(services) >= 2
        names = [s["name"] for s in services]
        assert any("Home Instead" in n for n in names)

    def test_medicine_has_providers(self):
        services = find_services("medicine_need")
        assert len(services) >= 2

    def test_food_has_providers(self):
        services = find_services("food_order")
        assert len(services) >= 1
        names = [s["name"] for s in services]
        assert any("Meals on Wheels" in n for n in names)

    def test_medical_emergency_has_911(self):
        services = find_services("medical_emergency")
        phones = [s["phone"] for s in services]
        assert "911" in phones

    def test_transportation_has_providers(self):
        services = find_services("transportation")
        assert len(services) >= 1

    def test_companionship_has_friendship_line(self):
        services = find_services("companionship")
        names = [s["name"] for s in services]
        assert any("Friendship Line" in n for n in names)

    def test_unknown_type_returns_empty(self):
        services = find_services("nonexistent_type")
        assert services == []

    def test_services_have_required_fields(self):
        for svc_type in ["shower_help", "medicine_need", "food_order", "medical_emergency"]:
            services = find_services(svc_type)
            for svc in services:
                assert "name" in svc
                assert "phone" in svc
                assert "description" in svc


class TestFindAllServices:
    def test_returns_all_categories(self):
        all_services = find_all_services()
        expected = ["shower_help", "medicine_need", "food_order", "mail_help",
                    "medical_emergency", "transportation", "companionship"]
        for cat in expected:
            assert cat in all_services

    def test_all_categories_have_providers(self):
        all_services = find_all_services()
        for cat, providers in all_services.items():
            assert len(providers) >= 1, f"{cat} has no providers"


class TestGet211Info:
    def test_211_has_phone(self):
        info = get_211_info()
        assert info["phone"] == "211"

    def test_211_has_website(self):
        info = get_211_info()
        assert "211bayarea" in info["website"]

    def test_211_is_24_7(self):
        info = get_211_info()
        assert "24/7" in info["hours"]

    def test_211_has_categories(self):
        info = get_211_info()
        assert len(info["categories"]) >= 5
