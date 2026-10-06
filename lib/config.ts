// Tunable pipeline constants (project brief, sections 8-9).
// Keep every magic number here so a dictionary or output tweak is one edit.

export const MIN_DEMAND_PCT = 10; // drop skills mentioned in fewer postings
export const MAX_NODES = 25; // cap the roadmap at the top-N skills
export const CACHE_TTL_DAYS = Number(process.env.CACHE_TTL_DAYS ?? 7);
export const JOB_PAGES = 3; // google_jobs pages fetched per role
export const YOUTUBE_PER_SKILL = 3; // resources kept per skill
