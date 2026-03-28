"""Analyze call transcripts to extract wellness indicators and service requests."""

from __future__ import annotations

import re

POSITIVE_WORDS = {
    "good", "great", "fine", "wonderful", "happy", "well", "better",
    "fantastic", "lovely", "okay", "excellent", "nice",
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "pain", "hurt", "sick", "tired",
    "lonely", "sad", "depressed", "worried", "confused", "dizzy",
    "weak", "worse", "struggling",
}

EMERGENCY_WORDS = {
    "fall", "fell", "fallen", "chest pain", "can't breathe",
    "breathing", "emergency", "help me", "ambulance", "911",
    "stroke", "heart", "unconscious", "bleeding",
}

MEDICATION_YES = {
    "yes", "took", "taken", "already", "done", "sure did", "of course",
}

MEDICATION_NO = {
    "no", "forgot", "haven't", "didn't", "not yet", "missed", "skip",
}

# Service request detection patterns
SERVICE_PATTERNS = {
    "shower_help": {
        "phrases": ["shower", "bath", "bathing", "help washing", "help me wash",
                     "need help cleaning", "can't shower", "washing up"],
        "label": "Shower / Bathing Help",
    },
    "medicine_need": {
        "phrases": ["need medicine", "ran out of", "prescription", "refill",
                     "pharmacy", "need my pills", "out of medication",
                     "need medication", "drug store"],
        "label": "Medicine / Prescription",
    },
    "food_order": {
        "phrases": ["hungry", "need food", "order food", "groceries", "grocery",
                     "meal", "breakfast", "lunch", "dinner", "eat", "cooking",
                     "can't cook", "need to eat", "delivery", "doordash",
                     "uber eats"],
        "label": "Food / Meal Help",
    },
    "mail_help": {
        "phrases": ["mail", "mailbox", "letter", "package", "post office",
                     "send mail", "check mail", "pick up mail", "postal",
                     "envelope", "stamp"],
        "label": "Mail / Package Help",
    },
    "medical_emergency": {
        "phrases": ["chest pain", "can't breathe", "stroke", "heart attack",
                     "ambulance", "911", "emergency", "bleeding badly",
                     "unconscious", "severe pain", "hospital"],
        "label": "Medical Emergency",
        "urgency": "critical",
    },
    "transportation": {
        "phrases": ["ride", "drive", "appointment", "doctor visit", "hospital",
                     "need a ride", "can't drive", "pick me up", "taxi", "uber"],
        "label": "Transportation",
    },
    "companionship": {
        "phrases": ["lonely", "alone", "no one", "nobody", "someone to talk",
                     "visit me", "company", "miss my family", "bored"],
        "label": "Companionship / Social",
    },
}


def detect_service_requests(transcript: str) -> list[dict]:
    """Detect service requests from the transcript."""
    text_lower = transcript.lower()
    requests = []

    for req_type, config in SERVICE_PATTERNS.items():
        matched_phrases = [p for p in config["phrases"] if p in text_lower]
        if matched_phrases:
            requests.append({
                "type": req_type,
                "label": config["label"],
                "details": f"Detected keywords: {', '.join(matched_phrases)}",
                "urgency": config.get("urgency", "normal"),
            })

    return requests


def analyze_transcript(transcript: str) -> dict:
    """Extract mood, wellness score, medication compliance, service requests, and concerns."""
    if not transcript:
        return {
            "mood": "unknown",
            "wellness_score": 5,
            "medication_taken": None,
            "concerns": [],
            "service_requests": [],
            "summary": "No transcript available",
        }

    text_lower = transcript.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))

    # Mood detection
    pos_count = len(words & POSITIVE_WORDS)
    neg_count = len(words & NEGATIVE_WORDS)

    if neg_count > pos_count + 1:
        mood = "concerning"
    elif neg_count > pos_count:
        mood = "sad"
    elif pos_count > neg_count + 1:
        mood = "happy"
    elif pos_count > neg_count:
        mood = "neutral"
    else:
        mood = "neutral"

    # Wellness score (1-10)
    base_score = 6
    wellness_score = max(1, min(10, base_score + pos_count - (neg_count * 2)))

    # Medication compliance
    med_yes = any(w in text_lower for w in MEDICATION_YES)
    med_no = any(w in text_lower for w in MEDICATION_NO)
    medication_taken = None
    if med_yes and not med_no:
        medication_taken = True
    elif med_no and not med_yes:
        medication_taken = False

    # Concerns / emergency detection
    concerns = []
    for phrase in EMERGENCY_WORDS:
        if phrase in text_lower:
            concerns.append(phrase)

    if "lonely" in text_lower or "alone" in text_lower:
        concerns.append("loneliness")
    if "confused" in text_lower or "remember" in text_lower:
        concerns.append("possible confusion")

    # Service request detection
    service_requests = detect_service_requests(transcript)

    # Adjust score for concerns
    if concerns:
        wellness_score = max(1, wellness_score - len(concerns))

    # Summary
    parts = [f"Mood: {mood}"]
    if medication_taken is True:
        parts.append("Medications taken")
    elif medication_taken is False:
        parts.append("Medications NOT taken")
    if concerns:
        parts.append(f"Concerns: {', '.join(concerns)}")
    if service_requests:
        svc_labels = [r["label"] for r in service_requests]
        parts.append(f"Service requests: {', '.join(svc_labels)}")

    return {
        "mood": mood,
        "wellness_score": wellness_score,
        "medication_taken": medication_taken,
        "concerns": concerns,
        "service_requests": service_requests,
        "summary": ". ".join(parts),
    }
