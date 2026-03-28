"""
Service directory for senior care — combines:
1. Curated local directory with verified SF providers
2. Google Places API for dynamic nearby search
3. 211 Bay Area for social services referral
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Curated SF Service Directory (verified phone numbers) ──

SERVICE_DIRECTORY: dict[str, list[dict[str, Any]]] = {
    "shower_help": [
        {
            "name": "Home Instead Senior Care — San Francisco",
            "phone": "+14154416490",
            "description": "In-home personal care including bathing, grooming, and companionship",
            "address": "1 Daniel Burnham Ct, Ste 200C, San Francisco, CA 94109",
            "area": "San Francisco",
            "hours": "24/7",
            "source": "curated",
        },
        {
            "name": "Visiting Angels — Bay Area",
            "phone": "+16507631873",
            "description": "Non-medical in-home care: bathing, personal care, meal prep, medication reminders",
            "address": "144 S Spruce Ave, South San Francisco, CA 94080",
            "area": "San Francisco Bay Area",
            "hours": "24/7 on-call",
            "source": "curated",
        },
        {
            "name": "Comfort Keepers — Bay Area",
            "phone": "+18669592969",
            "description": "In-home bathing, personal care, companionship, and dementia care",
            "address": "391 Taylor Blvd #210, Pleasant Hill, CA 94523",
            "area": "San Francisco Bay Area",
            "hours": "24/7 care available",
            "source": "curated",
        },
    ],
    "medicine_need": [
        {
            "name": "Alto Pharmacy — SF (Free Delivery)",
            "phone": "+18008745881",
            "description": "Free same-day/next-day prescription delivery. Handles insurance coordination.",
            "address": "1750 Cesar Chavez St, Unit A, San Francisco, CA 94124",
            "area": "San Francisco",
            "hours": "Mon-Fri 9am-6pm",
            "source": "curated",
        },
        {
            "name": "Walgreens Pharmacy — Castro (24hr)",
            "phone": "+14158268533",
            "description": "24-hour pharmacy with prescription delivery via app or phone",
            "address": "1333 Castro St, San Francisco, CA 94114",
            "area": "San Francisco",
            "hours": "24 hours",
            "source": "curated",
        },
        {
            "name": "CVS Pharmacy — Mission St",
            "phone": "+14153436273",
            "description": "Full-service pharmacy with prescription delivery",
            "address": "789 Mission St, San Francisco, CA 94103",
            "area": "San Francisco",
            "hours": "8am-10pm",
            "source": "curated",
        },
    ],
    "food_order": [
        {
            "name": "Meals on Wheels San Francisco",
            "phone": "+14159201111",
            "description": "Free home-delivered meals for homebound seniors 60+. Includes wellness checks.",
            "address": "2142 Jerrold Ave, San Francisco, CA 94124",
            "area": "San Francisco",
            "hours": "Mon-Fri 8:30am-4:30pm",
            "source": "curated",
        },
        {
            "name": "Project Open Hand",
            "phone": "+14154472300",
            "description": "Free nutritious meals and groceries for seniors and people with critical illnesses",
            "address": "730 Polk St, San Francisco, CA 94109",
            "area": "San Francisco",
            "hours": "Mon-Fri",
            "source": "curated",
        },
    ],
    "mail_help": [
        {
            "name": "USPS Carrier Pickup (Free)",
            "phone": "+18002221811",
            "description": "Free package pickup from your home during regular mail delivery. Schedule by phone or online.",
            "address": "N/A — pickup at your address",
            "area": "Nationwide",
            "hours": "Mon-Sat during mail delivery",
            "source": "curated",
        },
        {
            "name": "211 Bay Area — Social Services",
            "phone": "211",
            "description": "Free referral to local volunteer mail assistance, home help, and community services",
            "area": "San Francisco Bay Area",
            "hours": "24/7",
            "source": "211",
        },
    ],
    "medical_emergency": [
        {
            "name": "911 Emergency Services",
            "phone": "911",
            "description": "Immediate emergency response — call for chest pain, falls, strokes, breathing problems",
            "area": "Nationwide",
            "hours": "24/7",
            "source": "curated",
        },
        {
            "name": "UCSF Medical Center — Emergency",
            "phone": "+14153531008",
            "description": "Level I trauma center and top-ranked academic medical center",
            "address": "505 Parnassus Ave, San Francisco, CA 94143",
            "area": "San Francisco",
            "hours": "24/7",
            "source": "curated",
        },
        {
            "name": "Zuckerberg SF General Hospital — Trauma Center",
            "phone": "+16282068000",
            "description": "SF's only Level I Trauma Center. Treats all patients regardless of ability to pay.",
            "address": "1001 Potrero Ave, San Francisco, CA 94110",
            "area": "San Francisco",
            "hours": "24/7",
            "source": "curated",
        },
    ],
    "transportation": [
        {
            "name": "SF Paratransit (SF Access)",
            "phone": "+14153517050",
            "description": "ADA door-to-door van service for eligible seniors and disabled. Pre-scheduled rides.",
            "address": "SFMTA, San Francisco",
            "area": "San Francisco",
            "hours": "Reservations: (415) 285-6945",
            "source": "curated",
        },
        {
            "name": "GoGoGrandparent",
            "phone": "+18554646872",
            "description": "Uber/Lyft rides by phone — no smartphone needed. Press 0 to request a car.",
            "area": "Nationwide",
            "hours": "24/7",
            "source": "curated",
        },
    ],
    "companionship": [
        {
            "name": "Institute on Aging — Friendship Line",
            "phone": "+18009710016",
            "description": "24/7 emotional support line for older adults. Crisis support, reassurance, elder abuse counseling.",
            "address": "3575 Geary Blvd, San Francisco, CA 94118",
            "area": "Nationwide",
            "hours": "24/7",
            "source": "curated",
        },
        {
            "name": "San Francisco Senior Center — Aquatic Park",
            "phone": "+14157751866",
            "description": "Social activities, fitness, art classes, and community engagement for seniors",
            "address": "890 Beach St, San Francisco, CA 94109",
            "area": "San Francisco",
            "hours": "Mon-Fri daytime",
            "source": "curated",
        },
        {
            "name": "211 Bay Area — Social Services",
            "phone": "211",
            "description": "Free 24/7 referral to companionship programs, senior centers, and community services",
            "area": "San Francisco Bay Area",
            "hours": "24/7, 150+ languages",
            "source": "211",
        },
    ],
}


# ── 211 Bay Area Integration ──

SERVICES_211 = {
    "phone": "211",
    "text": "Send ZIP code to 898-211",
    "website": "https://211bayarea.org",
    "description": "Free, confidential 24/7 service connecting SF residents to local health and human services",
    "hours": "24/7, 365 days, 150+ languages",
    "categories": [
        "Food and nutrition",
        "Housing and shelter",
        "Senior services and aging",
        "Mental health and counseling",
        "Healthcare access",
        "Utility assistance",
        "Transportation",
    ],
}


def get_211_info() -> dict:
    """Get 211 Bay Area contact info and service categories."""
    return SERVICES_211


# ── Google Places API Integration ──

# SF coordinates
SF_LAT = 37.7749
SF_LNG = -122.4194

# Map our service types to Google Places types
PLACES_TYPE_MAP = {
    "shower_help": ["home_health_care_service"],
    "medicine_need": ["pharmacy"],
    "food_order": ["meal_delivery", "meal_takeaway"],
    "medical_emergency": ["hospital", "emergency_room"],
    "transportation": ["taxi_stand", "transit_station"],
    "companionship": ["community_center"],
}


async def search_nearby_services(
    service_type: str,
    lat: float = SF_LAT,
    lng: float = SF_LNG,
    radius: float = 5000.0,
    max_results: int = 5,
) -> list[dict]:
    """
    Search for nearby services using Google Places API (New).
    Requires GOOGLE_PLACES_API_KEY in .env.
    """
    api_key = getattr(settings, "google_places_api_key", "")
    if not api_key:
        logger.debug("Google Places API key not configured — skipping dynamic search")
        return []

    place_types = PLACES_TYPE_MAP.get(service_type, [])
    if not place_types:
        return []

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.currentOpeningHours,places.websiteUri",
    }

    payload = {
        "includedTypes": place_types,
        "maxResultCount": max_results,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius,
            }
        },
        "rankPreference": "DISTANCE",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:searchNearby",
                json=payload,
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for place in data.get("places", []):
            results.append({
                "name": place.get("displayName", {}).get("text", "Unknown"),
                "phone": place.get("nationalPhoneNumber", ""),
                "description": "",
                "address": place.get("formattedAddress", ""),
                "rating": place.get("rating"),
                "website": place.get("websiteUri", ""),
                "area": "San Francisco",
                "hours": "",
                "source": "google_places",
            })
        return results

    except Exception as e:
        logger.warning("Google Places API search failed: %s", e)
        return []


# ── Combined Service Lookup ──

def find_services(service_type: str) -> list[dict]:
    """Find curated local services for a given service request type."""
    return SERVICE_DIRECTORY.get(service_type, [])


async def find_services_enhanced(service_type: str) -> dict:
    """
    Find services from all sources:
    1. Curated directory (always available)
    2. Google Places API (if configured)
    3. 211 Bay Area info
    """
    curated = SERVICE_DIRECTORY.get(service_type, [])
    google_results = await search_nearby_services(service_type)

    return {
        "type": service_type,
        "curated": curated,
        "google_places": google_results,
        "call_211": SERVICES_211,
    }


def find_all_services() -> dict[str, list[dict]]:
    """Return the complete curated service directory."""
    return SERVICE_DIRECTORY


