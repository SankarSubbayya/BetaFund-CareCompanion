"""Seed demo data for hackathon presentation."""

import sys
import os
import random
from datetime import datetime, timedelta, timezone

import httpx

# Add project root to path for direct imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = "http://localhost:8001"

DEMO_SENIORS = [
    {
        "name": "Margaret Johnson",
        "phone": "+14155551001",
        "medications": ["Metformin 500mg", "Lisinopril 10mg", "Aspirin 81mg"],
        "checkin_schedule": "09:00",
        "notes": "Lives alone. Daughter Sarah visits on weekends.",
        "emergency_contacts": [{"name": "Sarah Johnson", "phone": "+14155552001", "relation": "daughter"}],
    },
    {
        "name": "Robert Chen",
        "phone": "+14155551002",
        "medications": ["Amlodipine 5mg", "Atorvastatin 20mg"],
        "checkin_schedule": "10:00",
        "notes": "Recently widowed. Enjoys gardening. Sometimes forgets evening meds.",
        "emergency_contacts": [{"name": "David Chen", "phone": "+14155552002", "relation": "son"}],
    },
    {
        "name": "Dorothy Williams",
        "phone": "+14155551003",
        "medications": ["Levothyroxine 50mcg", "Omeprazole 20mg", "Vitamin D"],
        "checkin_schedule": "08:30",
        "notes": "Has mild mobility issues. Uses a walker. Very chatty and upbeat.",
        "emergency_contacts": [{"name": "James Williams", "phone": "+14155552003", "relation": "son"}],
    },
]

SAMPLE_TRANSCRIPTS = [
    "I'm feeling great today! Yes, I took all my medications this morning. Everything is wonderful.",
    "I'm okay, nothing special. Yes I took my pills. Just a quiet day.",
    "I'm feeling a bit tired today. Yes I took my medications though. Just didn't sleep well.",
    "I'm not feeling great. I forgot to take my medications. I've been feeling lonely lately.",
    "I fell yesterday in the bathroom. My hip hurts. I took my medications though.",
    "I'm doing fine, had a nice breakfast. Yes, took all my meds. My daughter called yesterday which was nice.",
    "Feeling good! Already took my Metformin and everything. Going to do some gardening today.",
    "I'm a bit dizzy today and confused about which day it is. I think I took my pills but I'm not sure.",
]


def seed():
    client = httpx.Client(base_url=BASE, timeout=10)

    # Create seniors via API
    for senior in DEMO_SENIORS:
        try:
            resp = client.post("/api/seniors", json=senior)
            if resp.status_code == 201:
                print(f"  Created {senior['name']}")
            elif resp.status_code == 409:
                print(f"  Already exists: {senior['name']}")
            else:
                print(f"  Failed to create {senior['name']}: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"  Error creating {senior['name']}: {e}")

    # Seed historical check-ins via mock webhook
    from app.database import get_db
    from app.services.call_analyzer import analyze_transcript as analyze
    from app.models.checkin import CheckIn

    db = get_db()

    for senior in DEMO_SENIORS:
        for days_ago in range(7, 0, -1):
            ts = (datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 3))).isoformat()
            transcript = random.choice(SAMPLE_TRANSCRIPTS)
            analysis = analyze(transcript)

            checkin = CheckIn(
                senior_phone=senior["phone"],
                call_id=f"seed_{senior['phone']}_{days_ago}",
                timestamp=ts,
                transcript=transcript,
                mood=analysis["mood"],
                wellness_score=analysis["wellness_score"],
                medication_taken=analysis["medication_taken"],
                concerns=analysis["concerns"],
                service_requests=analysis.get("service_requests", []),
                summary=analysis["summary"],
            )
            db.put("checkins", f"{senior['phone']}:{ts}", checkin.model_dump())

        print(f"  Seeded 7 days of check-ins for {senior['name']}")

    # Add a couple demo alerts
    from app.services.alert_engine import evaluate_checkin

    # Create a concerning check-in for Margaret (fall + missed meds)
    concern_checkin = CheckIn(
        senior_phone="+14155551001",
        call_id="seed_alert_1",
        timestamp=datetime.now(timezone.utc).isoformat(),
        transcript="I fell yesterday. My hip hurts badly. I forgot my medications.",
        mood="concerning",
        wellness_score=2,
        medication_taken=False,
        concerns=["fell", "pain"],
        summary="Mood: concerning. Medications NOT taken. Concerns: fell, pain",
    )
    db.put("checkins", f"+14155551001:{concern_checkin.timestamp}", concern_checkin.model_dump())
    evaluate_checkin(concern_checkin, "Margaret Johnson")
    print("  Created emergency alerts for Margaret Johnson")

    # Service request: Robert needs help with shower and food
    from app.services.service_directory import find_services

    svc_ts = datetime.now(timezone.utc).isoformat()
    svc_checkin = CheckIn(
        senior_phone="+14155551002",
        call_id="seed_service_1",
        timestamp=svc_ts,
        transcript="I need help with my shower today. Also I'm hungry and can't cook, can someone bring me food?",
        mood="sad",
        wellness_score=4,
        medication_taken=True,
        concerns=[],
        service_requests=[
            {"type": "shower_help", "label": "Shower / Bathing Help", "details": "Detected keywords: shower", "urgency": "normal"},
            {"type": "food_order", "label": "Food / Meal Help", "details": "Detected keywords: hungry, food, cook", "urgency": "normal"},
        ],
        summary="Mood: sad. Medications taken. Service requests: Shower / Bathing Help, Food / Meal Help",
    )
    db.put("checkins", f"+14155551002:{svc_ts}", svc_checkin.model_dump())
    evaluate_checkin(svc_checkin, "Robert Chen")

    # Store service recommendations
    for svc in svc_checkin.service_requests:
        services = find_services(svc["type"])
        if services:
            db.put("service_recommendations", f"+14155551002:{svc_ts}:services_{svc['type']}", {
                "senior_phone": "+14155551002",
                "senior_name": "Robert Chen",
                "request_type": svc["type"],
                "label": svc["label"],
                "timestamp": svc_ts,
                "recommended_services": services,
            })
    print("  Created service requests for Robert Chen (shower + food)")

    # Service request: Dorothy needs mail help and medicine
    svc_ts2 = datetime.now(timezone.utc).isoformat()
    svc_checkin2 = CheckIn(
        senior_phone="+14155551003",
        call_id="seed_service_2",
        timestamp=svc_ts2,
        transcript="I need someone to check my mail for me. Also I ran out of my prescription, I need a refill from the pharmacy.",
        mood="neutral",
        wellness_score=5,
        medication_taken=False,
        concerns=[],
        service_requests=[
            {"type": "mail_help", "label": "Mail / Package Help", "details": "Detected keywords: mail", "urgency": "normal"},
            {"type": "medicine_need", "label": "Medicine / Prescription", "details": "Detected keywords: prescription, refill, pharmacy", "urgency": "normal"},
        ],
        summary="Mood: neutral. Medications NOT taken. Service requests: Mail / Package Help, Medicine / Prescription",
    )
    db.put("checkins", f"+14155551003:{svc_ts2}", svc_checkin2.model_dump())
    evaluate_checkin(svc_checkin2, "Dorothy Williams")

    for svc in svc_checkin2.service_requests:
        services = find_services(svc["type"])
        if services:
            db.put("service_recommendations", f"+14155551003:{svc_ts2}:services_{svc['type']}", {
                "senior_phone": "+14155551003",
                "senior_name": "Dorothy Williams",
                "request_type": svc["type"],
                "label": svc["label"],
                "timestamp": svc_ts2,
                "recommended_services": services,
            })
    print("  Created service requests for Dorothy Williams (mail + medicine)")

    print("\nDone! Visit http://localhost:8001")


if __name__ == "__main__":
    seed()
