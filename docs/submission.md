# LiveRoadmap — submission pack (Phase 4, Sat Oct 10)

## Demo video script (under 3 minutes)

Record with the app running locally in `CACHE_ONLY=true` mode. Narration optional.

| Time | Shot | Script |
|---|---|---|
| 0:00–0:15 | Landing page | "Static roadmaps go stale in months. LiveRoadmap rebuilds the learning path from today's job postings." |
| 0:15–0:45 | Click Backend Developer | Roadmap appears. Point at the header: "28 live postings from India, fetched today" — the last-fetched date proves the data is real. |
| 0:45–1:45 | Click 2–3 nodes | "Each node shows demand — 82% of postings mention REST APIs — its prerequisites, and current YouTube tutorials fetched this week." |
| 1:45–2:15 | Skill-gap mode | Toggle it on, mark 2–3 skills known. "Known skills dim, and the app highlights exactly what to learn next." Show the progress pill. |
| 2:15–2:50 | Code (quick) | `lib/serpapi.ts` (cache + credit log), `lib/extract.ts`, `lib/rank.ts`. "Two SerpApi engines do the real work: Google Jobs for demand, YouTube for resources. Without search data there is no output." |

Upload as public or unlisted (YouTube/Loom). Open the link in a private window before submitting.

## Submission description (paste into the dashboard)

**What it does:** LiveRoadmap turns live job postings into a learning roadmap. Pick a target role and the app pulls current Google Jobs listings, counts which skills employers actually ask for, ranks them by demand, orders them by prerequisites into a node-tree roadmap, and attaches current YouTube tutorials to each skill. A skill-gap mode lets you mark what you know and highlights what to learn next.

**Who it helps:** students and freshers in India choosing what to learn — the roadmap tracks live hiring demand instead of going stale.

**How it uses SerpApi:** `google_jobs` supplies skill demand (up to 3 pages per role, India); `youtube` supplies current resources per top skill. Every call goes through a cache-first client with a credit log; demo mode serves cached data and can never trigger an uncached search.

**Track:** Knowledge & Public Interest.

## Participant details (fill in)

- Lead: Aarya Patel, aaryapatel1807@gmail.com, +91 …, occupation: B.Tech CSE undergrad, years of experience: …
- Teammates: none (solo)

## Disclosures (paste)

- The project did not exist before the hackathon; it was built 6–10 Oct 2026 for this event.
- The node-tree UI's visual language (pastel design tokens, glassy node cards) is reused from the author's LearnFlow project (github.com/aaryapatel1807/learnflow); all LiveRoadmap components were written fresh.
- AI tools used: Muse (Meta) as the AI development assistant.

## Pre-submit checklist

- [ ] Repo public: https://github.com/aaryapatel1807/LiveRoadmap
- [ ] `.env` and `.cache/` not in the repo; git history checked for the key: `git log -p --all -S 'SERPAPI_KEY=' -- .env` shows nothing, and no key string in any committed file
- [ ] Demo video link opens in a private window, under 3 minutes
- [ ] Description + track set, participant details filled, disclosures pasted
- [ ] Rules and Terms accepted
- [ ] **Submit project** clicked before 10 Oct 23:59 IST (aim Saturday afternoon); confirmation saved
