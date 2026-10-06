/**
 * scripts/sample.ts — one-off Phase 0 probe.
 * Fetches ONE google_jobs page and ONE youtube search from SerpApi and saves
 * the raw JSON into /fixtures. Phase 1 parsing code is written against these
 * files (see project brief section 14, rule 2: never invent response fields).
 *
 * Usage:  SERPAPI_KEY=... npx tsx scripts/sample.ts
 * The key is read from the environment only. It is never logged or committed.
 */

import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.SERPAPI_KEY;
if (!KEY) {
  console.error("SERPAPI_KEY is not set in the environment. Aborting.");
  process.exit(1);
}

const BASE = "https://serpapi.com/search.json";

async function call(params: Record<string, string>, label: string) {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", KEY as string);
  console.log(`[${label}] GET ${url.origin}${url.pathname}?${mask(url)}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[${label}] HTTP ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`);
  }
  return res.json();
}

function mask(url: URL): string {
  const p = new URLSearchParams(url.search);
  p.set("api_key", "***");
  return p.toString();
}

async function main() {
  mkdirSync("fixtures", { recursive: true });

  // One google_jobs page: role query for Backend Developer, India.
  const jobs = await call(
    { engine: "google_jobs", q: "backend developer jobs India", location: "India", gl: "in", hl: "en" },
    "google_jobs"
  );
  writeFileSync("fixtures/google_jobs.sample.json", JSON.stringify(jobs, null, 2));
  const jobKeys = jobs.jobs_results?.[0] ? Object.keys(jobs.jobs_results[0]) : [];
  console.log(`[google_jobs] saved ${jobs.jobs_results?.length ?? 0} jobs. First-job fields: ${jobKeys.join(", ")}`);
  console.log(`[google_jobs] pagination field present: ${"serpapi_pagination" in jobs}`);

  // One youtube search: resource query for a top skill.
  const yt = await call({ engine: "youtube", search_query: "React tutorial for beginners" }, "youtube");
  writeFileSync("fixtures/youtube.sample.json", JSON.stringify(yt, null, 2));
  const videoKeys = yt.video_results?.[0] ? Object.keys(yt.video_results[0]) : [];
  console.log(`[youtube] saved ${yt.video_results?.length ?? 0} videos. First-video fields: ${videoKeys.join(", ")}`);

  console.log("Done. Raw responses written to fixtures/. Review field names before Phase 1.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
