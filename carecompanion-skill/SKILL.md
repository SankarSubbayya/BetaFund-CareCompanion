---
name: carecompanion
description: Voice-first AI senior care companion. Calls seniors daily to check mood, medications, and needs. Detects falls, loneliness, and service requests (food, medicine, bathing, transportation). Alerts family with recommended local services. Use when building senior care, voice AI, or healthcare check-in applications.
license: MIT
compatibility: Requires Python 3.12+, Docker (for Aerospike), and a Bland AI API key for voice calls.
metadata:
  author: SankarSubbayya
  version: "1.0.0"
---

# CareCompanion

Voice-first AI senior care companion that keeps seniors safe and families informed.

## What This Skill Does

1. **Daily Voice Check-ins** — Uses Bland AI to call seniors and ask about mood, medications, and needs
2. **Transcript Analysis** — Extracts mood, wellness score, medication compliance, and service requests from call transcripts
3. **Alert Engine** — Fires alerts for falls, missed meds, low mood, emergencies, and service requests
4. **Service Directory** — Recommends verified local SF providers (Meals on Wheels, pharmacies, hospitals, paratransit)
5. **Family Dashboard** — Real-time wellness trends, alerts, and service request tracking

## Quick Start

```bash
# Install dependencies
uv sync

# Start Aerospike (Docker)
docker run -d --name aerospike -p 3100:3000 aerospike/aerospike-server

# Configure
# Set BLAND_AI_API_KEY in .env
# Set BASE_URL to your ngrok URL

# Run
uv run python main.py

# Seed demo data
uv run python scripts/seed_data.py
```

## Architecture

```
Senior's Phone <-> Bland AI <-> Webhook -> Analyzer -> Alert Engine -> Dashboard
                                                    -> Service Directory
```

## Key Files

- `app/services/bland_ai.py` — Voice call integration and prompts
- `app/services/call_analyzer.py` — NLP transcript analysis (7 service categories)
- `app/services/alert_engine.py` — Rule-based alert generation
- `app/services/service_directory.py` — Verified SF providers + Google Places + 211
- `app/routers/webhooks.py` — Bland AI webhook processing
- `frontend/` — Family dashboard (vanilla JS + Chart.js)

## Service Categories Detected

| Category | Example Phrases |
|----------|----------------|
| Shower/Bath Help | "need help showering", "can't bathe" |
| Medicine | "ran out of prescription", "need refill" |
| Food/Meals | "hungry", "can't cook", "need food" |
| Mail/Packages | "check my mail", "need to send a letter" |
| Transportation | "need a ride", "doctor appointment" |
| Medical Emergency | "chest pain", "I fell", "can't breathe" |
| Companionship | "lonely", "no one visits" |

## Tech Stack

- **Bland AI** — Voice agent for phone calls
- **Aerospike** — Real-time NoSQL database
- **Auth0** — Authentication
- **FastAPI** — Python backend
- **Chart.js** — Wellness trend visualization
