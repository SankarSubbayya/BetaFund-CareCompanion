# CareCompanion — Skills & Technologies

## Languages
- **Python 3.12** — Backend API, business logic, transcript analysis
- **JavaScript (ES6+)** — Frontend dashboard SPA
- **HTML5 / CSS3** — Dashboard UI with responsive design

## Frameworks & Libraries
- **FastAPI** — High-performance async Python web framework
- **Pydantic** — Data validation and settings management
- **APScheduler** — Automated daily check-in scheduling
- **Chart.js** — Wellness trend visualization
- **httpx** — Async HTTP client for API integrations

## Sponsor Technologies
- **Bland AI** — Voice agent for outbound/inbound senior check-in calls
- **Aerospike** — Real-time NoSQL database for seniors, check-ins, alerts
- **Auth0** — JWT-based authentication for family dashboard

## Infrastructure
- **Docker** — Containerized Aerospike database
- **ngrok** — Public HTTPS tunneling for Bland AI webhooks
- **uvicorn** — ASGI server for FastAPI

## AI & NLP
- **Bland AI LLM** — Powers natural voice conversations with seniors
- **Keyword-based NLP** — Transcript analysis for mood, wellness, medication compliance
- **Service request detection** — Pattern matching for 7 service categories

## Data & APIs
- **Bland AI API** — Outbound calls, webhooks, call transcripts
- **Google Places API** — Dynamic nearby service lookup (optional)
- **211 Bay Area** — Social services referral integration
- **Curated Service Directory** — Verified SF providers with real phone numbers

## Architecture Patterns
- **Webhook-driven async processing** — Bland AI → webhook → analyze → alert
- **Rule-based alert engine** — Severity levels: critical, high, medium, low
- **In-memory fallback** — Graceful degradation if Aerospike unavailable
- **Auto-refresh dashboard** — 15-second polling for real-time updates

## Key Features Built
| Feature | Skill |
|---------|-------|
| Daily voice check-ins | Bland AI API, prompt engineering |
| Transcript analysis | NLP, keyword extraction |
| Service request detection | Pattern matching (7 categories) |
| Alert engine | Rule-based evaluation, severity classification |
| Family dashboard | JavaScript SPA, Chart.js, responsive CSS |
| Service directory | API integration, data curation |
| Scheduled calls | APScheduler, cron-based jobs |
| Data persistence | Aerospike, JSON serialization |
| Authentication | Auth0 SPA SDK, JWT verification |
| Search | Client-side filtering by name/phone |

## Development Tools
- **uv** — Python package manager
- **Git / GitHub** — Version control
- **VS Code** — IDE
- **Claude Code** — AI-assisted development
