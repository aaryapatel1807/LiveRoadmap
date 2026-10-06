# LiveRoadmap

**Don't guess what to learn. Follow today's job postings.**

LiveRoadmap turns live job postings into a learning roadmap. Pick a target role (Backend Developer, Frontend Developer, Data Analyst, or DevOps Engineer — India). The app pulls current Google Jobs listings through SerpApi, counts which skills the postings ask for, ranks them by demand, orders them by prerequisites, and draws a node-tree roadmap. Each node shows its demand percentage and carries current YouTube resources, also fetched through SerpApi. A skill-gap mode lets you mark what you already know and highlights what to learn next.

The insight: hiring demand changes faster than static roadmaps get updated. This one is rebuilt from today's postings.

Built for the **SerpApi India Hackathon 2026** — track: **Knowledge & Public Interest**.

## How it works

```mermaid
flowchart LR
    A[Pick a role] --> B[Google Jobs via SerpApi]
    B --> C[Extract skills\n(deterministic dictionary)]
    C --> D[Rank by demand %]
    D --> E[Order by prerequisites\n(Kahn's topological sort)]
    E --> F[YouTube via SerpApi\n(resources per top skill)]
    F --> G[Node-tree roadmap]
    G --> H[Skill-gap mode\n(mark known, see Next up)]
```

1. **Fetch** — up to 3 pages of Google Jobs per role (`q`, `location=India`, `gl=in`), following `serpapi_pagination`.
2. **Extract** — postings are deduped by title + company; every skill alias is matched with a word-boundary regex against the title, description, and highlights. Short aliases (`Go`, `R`, `C`) are case-sensitive and only count when another language term appears in the same posting.
3. **Rank** — `demandPct = postings mentioning the skill / postings analyzed × 100`. Skills below 10% are dropped; the top 25 are kept.
4. **Order** — prerequisites form a DAG; kept skills whose prerequisites were filtered out are added back as inferred nodes so the tree stays connected. Ties break by higher demand.
5. **Enrich** — one YouTube search per top-10 skill (`"<skill> tutorial for beginners"`), keeping up to 3 results, preferring tutorial/course/beginner titles and higher view counts.
6. **Render** — React Flow node tree, left-to-right by prerequisite depth, demand badge and category color per node, click for the detail panel.

## SerpApi usage

| Engine | Purpose | Key parameters |
|---|---|---|
| `google_jobs` | Skill demand per role | `q`, `location`, `gl=in`, `hl=en`, `next_page_token` |
| `youtube` | Current resources per skill | `search_query` |

Every call goes through `lib/serpapi.ts`: cache-first (key = engine + sorted params, under `.cache/serpapi/`), each real call appended to `.cache/credit-log.jsonl` with a running count. One role costs ~13 searches; four roles ≈ 52 of the 250/month free plan.

## Setup

Prerequisites: Node.js 18+, a free [SerpApi](https://serpapi.com/users/sign_up?plan=free&utm_source=india_hackathon_26) key.

```bash
git clone https://github.com/aaryapatel1807/LiveRoadmap.git
cd LiveRoadmap
npm install
cp .env.example .env        # then set SERPAPI_KEY in .env
npx tsx scripts/prewarm.ts  # one live run: builds .cache/roadmap.<role>.json
```

Then enable demo mode so the UI can never trigger an uncached search:

```bash
# in .env
CACHE_ONLY=true
npm run dev                 # http://localhost:3000
```

### Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SERPAPI_KEY` | for live fetch | — | SerpApi key. Server-side only, never committed, never in client code |
| `CACHE_ONLY` | — | `false` | `true` blocks all live SerpApi calls; cache misses return 503 |
| `CACHE_TTL_DAYS` | — | `7` | How long a cached response counts as fresh |

### Scripts

| Script | Purpose |
|---|---|
| `npx tsx scripts/sample.ts` | One-off probe: saves one `google_jobs` + one `youtube` response to `/fixtures` (parsing code is written against these) |
| `npx tsx scripts/prewarm.ts` | Full pipeline for all four roles → `.cache/roadmap.<role>.json` |
| `npm test` | Vitest unit tests (extraction, ranking, ordering) |
| `npm run lint` / `npx tsc --noEmit` | Lint + typecheck |

## Project layout

```
/app                 pages, API routes (/api/roadmap?role=<id>)
/components          RoadmapGraph (React Flow), SidePanel
/lib                 serpapi.ts (cache + credit log), jobs.ts, resources.ts,
                     extract.ts, rank.ts, pipeline.ts, roles.ts, config.ts
/data                skills.json (80-skill dictionary), roles.json
/fixtures            real saved SerpApi responses (parsing reference)
/scripts             sample.ts (probe), prewarm.ts (cache builder)
/public/dev-mock     clearly-labeled placeholder data for UI dev (?mock=1)
```

## Skill-gap mode

Client-side only, no accounts. Known skills are stored in `localStorage` per role. Known nodes dim; the first unknown node whose prerequisites are all known is highlighted **Next up**; progress shows as known / total.

## Disclosures

- **Existing work reused:** the node-tree UI's visual language (pastel design tokens, glassy node cards) comes from the author's [LearnFlow](https://github.com/aaryapatel1807/learnflow) project; all LiveRoadmap components were written fresh for this project.
- **AI tools used:** built with Muse (Meta) as the AI development assistant — architecture, code, tests, and docs were produced with AI assistance and reviewed by the author.
- **Data:** roadmaps are derived from live Google Jobs postings; demand percentages reflect the sampled postings, not the whole job market.

## Definition of done (per project brief)

- [x] Four roles produce roadmaps from real cached SerpApi data
- [x] Two SerpApi engines visibly necessary (`google_jobs`, `youtube`)
- [x] Gap mode works
- [x] README setup works from a fresh clone
- [ ] Demo video recorded, submission confirmed (Phase 4)
- [x] No secrets in the repo or its history
