# CareCompanion

A care companion app with Next.js frontend and FastAPI backend, using EverMind.ai for memory storage and InsForge as the backend platform.

## Setup

### Prerequisites
- Node.js
- Python 3.10+
- InsForge account
- EverMind.ai account
- Google OAuth credentials

### InsForge Configuration
1. Sign up at InsForge and create a project
2. Copy `project.json.example` to `.insforge/project.json`
3. Fill in your actual InsForge credentials

### EverMind.ai Setup
1. Sign up at [console.evermind.ai](https://console.evermind.ai)
2. Get your API key
3. Add to `.env`: `EVERMIND_API_KEY=your_key_here`

### Google OAuth
1. Create OAuth app in Google Console
2. Add credentials to `care-companion-ui/.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   NEXTAUTH_SECRET=your_random_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

### Running the App
1. Backend: `cd fastapi-backend && uvicorn main:app --reload`
2. Frontend: `cd care-companion-ui && npm run dev`

## Features
- Google sign-in
- Role-based views (Caregiver, Patient, Emergency Contact)
- EverMind.ai memory storage via FastAPI