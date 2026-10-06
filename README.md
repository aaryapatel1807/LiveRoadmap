# LiveRoadmap — project skeleton (Phase 0)

LiveRoadmap turns live job postings into a learning roadmap. Pick a target role
(Backend Developer, Frontend Developer, Data Analyst, DevOps Engineer — India).
The app pulls current Google Jobs listings through SerpApi, counts which skills
postings ask for, ranks them by demand, orders them by prerequisites and draws a
node-tree roadmap. Each node carries current YouTube resources fetched through
Serpapi. A skill-gap mode lets you mark what you already know and see what is
left.

Full source of truth: `../user/files/LiveRoadmap_project_brief_for_AI_assistants.md`

## Status

Phase 0 in progress. Nothing runs yet.

## Setup (planned)

1. Copy `.env.example` to `.env` and set `SERPAPI_KEY`.
2. `npm install`
3. `npm run dev`
