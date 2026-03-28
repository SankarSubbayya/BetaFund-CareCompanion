# CareCompanion

Voice-first AI senior care companion. Daily automated phone check-ins keep seniors safe and families informed — plus on-demand service requests for food, medicine, bathing, mail, transportation, and emergencies.

## Architecture — 3-Agent System

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        Senior["👴 Senior\n(Phone)"]
        Family["👨‍👩‍👧 Family\n(Dashboard)"]
    end

    subgraph BlandAI["🎙️ Bland AI (Voice)"]
        OutboundCall["Outbound Calls"]
        InboundCall["Inbound Calls"]
        NotifyCall["Notification Calls"]
    end

    subgraph Agents["🤖 CareCompanion Agents"]
        subgraph A1["Agent 1: Onboarding"]
            Onboard["Register seniors\nvia voice call"]
        end
        subgraph A2["Agent 2: Daily Check-in"]
            Recall["Recall memories"]
            Call["Initiate call"]
            Analyze["Analyze transcript"]
            Alert["Generate alerts"]
            Match["Match services"]
            Store["Store memory"]
        end
        subgraph A3["Agent 3: Scheduling & Notification"]
            Schedule["Manage schedules"]
            Notify["Call family\nfor alerts"]
            Appts["Track appointments"]
        end
    end

    subgraph EM["🧠 EverMind (Memory)"]
        MemAPI["Memory API\n(Store + Recall)"]
    end

    subgraph IF["🔧 InsForge (Backend)"]
        DB["PostgreSQL + Auth"]
    end

    subgraph Services["📒 Service Directory"]
        SF["Verified SF Providers\n+ 211 Bay Area"]
    end

    Family -->|"Register loved one"| Onboard
    Onboard -->|"Voice onboarding"| OutboundCall
    OutboundCall --> Senior

    Recall -->|"Get past conversations"| MemAPI
    Call -->|"Call with context"| OutboundCall
    Senior -->|"Calls in"| InboundCall
    InboundCall --> Analyze
    OutboundCall --> Analyze
    Analyze --> Alert
    Alert --> Match
    Match --> SF
    Store -->|"Save conversation"| MemAPI
    Alert -->|"Critical/High"| Notify
    Notify -->|"Call family"| NotifyCall
    NotifyCall --> Family
    Family -->|"View dashboard"| DB
    Schedule -->|"Daily cron"| Call
```

## How It Works

1. **Bland AI** calls your loved one daily for a friendly check-in
2. Covers: mood, medications, and any needs or concerns
3. **EverMind** remembers past conversations — AI follows up on previous concerns
4. Detects service needs: "I need help showering", "I'm hungry", "I need my medicine"
5. **Alerts** fire automatically — family sees them on the dashboard with recommended local services
6. **InsForge** powers the backend infrastructure

## Agent Flow

```mermaid
sequenceDiagram
    participant OA as 🤖 Onboarding Agent
    participant DA as 🤖 Daily Check-in Agent
    participant SA as 🤖 Scheduling Agent
    participant EM as 🧠 EverMind
    participant B as 🎙️ Bland AI
    participant Sr as 👴 Senior
    participant Fam as 👨‍👩‍👧 Family

    Note over OA: Agent 1: Onboarding
    Fam->>OA: Register loved one
    OA->>B: Voice onboarding call
    B->>Fam: Collect name, phone, meds
    OA->>OA: Create senior profile

    Note over DA: Agent 2: Daily Check-in
    DA->>EM: Recall past conversations
    EM-->>DA: "Hip hurting, missed meds"
    DA->>B: Call with memory context
    B->>Sr: 📞 "Hi Margaret, how is your hip?"
    Sr-->>B: Conversation
    B->>DA: Transcript
    DA->>DA: Analyze mood, meds, services
    DA->>EM: Store new memory

    Note over SA: Agent 3: Scheduling & Notification
    DA->>SA: Critical alert detected!
    SA->>B: Call family
    B->>Fam: 📞 "Margaret fell, needs attention"
    SA->>Fam: Dashboard alert + services
```

## Tech Stack

| Tool | Role |
|------|------|
| **Bland AI** | Voice agent — conducts check-in phone calls |
| **EverMind** | Persistent memory — AI remembers past conversations |
| **InsForge** | Backend infrastructure (Postgres, auth, storage) |
| **FastAPI** | Python backend API |
| **Chart.js** | Wellness trend visualization |

## Quick Start

```bash
# Install dependencies
uv sync

# Start EverMind (optional — for persistent memory)
cd ../EverMemOS && docker-compose up -d
PYTHONPATH=src uv run python src/run.py &

# Configure CareCompanion
# Edit .env with BLAND_AI_API_KEY and BASE_URL (ngrok)

# Start server
uv run python main.py

# Start ngrok (for Bland AI webhooks)
ngrok http 8000

# Seed demo data
uv run python scripts/seed_data.py
```

## Service Categories

| Service | Detection | SF Providers |
|---------|-----------|--------------|
| 🚿 Shower/Bath | "shower", "help bathing" | Home Instead, Visiting Angels |
| 💊 Medicine | "prescription", "refill" | Alto Pharmacy, Walgreens, CVS |
| 🍽️ Food/Meals | "hungry", "can't cook" | Meals on Wheels SF, Project Open Hand |
| 📬 Mail | "check my mail", "package" | USPS Carrier Pickup |
| 🚗 Transportation | "need a ride", "doctor" | SF Paratransit, GoGoGrandparent |
| 🚑 Emergency | "fell", "chest pain", "911" | 911, UCSF Medical, SF General |
| 💛 Companionship | "lonely", "no one visits" | Institute on Aging Friendship Line |

## API Endpoints

### Seniors
- `POST /api/seniors` — Add a senior
- `GET /api/seniors` — List all
- `POST /api/checkins/trigger/{phone}` — Trigger a call

### Alerts & Services
- `GET /api/alerts` — Active alerts
- `GET /api/services` — Service directory
- `GET /api/services/211` — 211 Bay Area info

### Webhooks
- `POST /api/webhooks/bland/call-complete` — Bland AI outbound callback
- `POST /api/webhooks/bland/inbound-complete` — Inbound call callback

## Project Structure

```
CareCompanion/
├── main.py                          # FastAPI app entry point
├── app/
│   ├── config.py                    # Settings from .env
│   ├── database.py                  # In-memory data store
│   ├── auth.py                      # Auth dependency
│   ├── models/                      # Pydantic models
│   │   ├── senior.py                #   Senior profile
│   │   ├── checkin.py               #   Check-in + service requests
│   │   └── alert.py                 #   Alert with severity levels
│   ├── routers/                     # API endpoints
│   │   ├── seniors.py               #   CRUD for seniors
│   │   ├── checkins.py              #   Check-in history + trigger calls
│   │   ├── alerts.py                #   Alert listing + acknowledge
│   │   ├── webhooks.py              #   Bland AI webhook processing
│   │   └── services.py              #   Service directory + 211 + Google Places
│   └── services/                    # Business logic
│       ├── bland_ai.py              #   Voice call integration + prompts
│       ├── call_analyzer.py         #   NLP transcript analysis (7 categories)
│       ├── alert_engine.py          #   Rule-based alert generation
│       ├── memory.py                #   EverMind memory integration
│       ├── scheduler.py             #   APScheduler daily cron
│       ├── service_directory.py     #   Verified SF providers + 211 + Google Places
│       └── inbound.py               #   Inbound call agent config
├── frontend/                        # Family dashboard
│   ├── index.html                   #   Sidebar layout + pages
│   ├── style.css                    #   Responsive styles
│   └── app.js                       #   Dashboard logic + auto-refresh
├── scripts/
│   └── seed_data.py                 #   Demo data seeder
└── docs/
    └── architecture.html            #   Interactive architecture diagrams
```

## Interactive Architecture Diagrams

Open [docs/architecture.html](docs/architecture.html) in a browser for detailed interactive diagrams including:
- High-level system architecture with all components
- Call flow with memory sequence diagram
- Data model (ER diagram)
- Service request detection flow
