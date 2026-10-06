// Google Jobs fetching (project brief, sections 5-6).
// Fetches up to JOB_PAGES pages per role, following serpapi_pagination, and
// normalizes raw results into Posting objects for lib/extract.ts.
//
// FIELD NAMES VERIFIED 2026-10-06 against fixtures/google_jobs.sample.json:
// jobs_results[].title/company_name/location/description/extensions (no
// job_highlights in this shape; mapping kept defensively) and
// serpapi_pagination.next_page_token.

import { JOB_PAGES } from "./config";
import { serpApiCall } from "./serpapi";
import { asArray, asRecord, asString, type JsonRecord } from "./json";
import type { Posting } from "./types";

export interface JobsFetch {
  postings: Posting[];
  /** ISO date of the oldest SerpApi call used (cache mtime or now) */
  fetchedAt: string;
}

function normalizePosting(raw: JsonRecord): Posting {
  const highlights: string[] = [];
  // extensions carry facts like ["15 hours ago", "Full-time"].
  for (const e of asArray(raw.extensions)) {
    const s = asString(e);
    if (s) highlights.push(s);
  }
  // job_highlights was expected per the brief but is absent from the real
  // fixture; keep the mapping in case other queries return it.
  for (const h of asArray(raw.job_highlights)) {
    if (typeof h === "string") {
      highlights.push(h);
      continue;
    }
    const rec = asRecord(h);
    const items = asArray(rec.items).map(asString).filter(Boolean);
    if (items.length > 0) highlights.push(`${asString(rec.title)}: ${items.join("; ")}`);
    else if (asString(rec.title)) highlights.push(asString(rec.title));
  }
  return {
    title: asString(raw.title) || asString(raw.job_title),
    company: asString(raw.company_name),
    description: asString(raw.description),
    highlights,
  };
}

export async function fetchJobsForRole(searchQuery: string, location: string, gl = "in", hl = "en"): Promise<JobsFetch> {
  const postings: Posting[] = [];
  let fetchedAt = new Date().toISOString();
  let pageToken: string | undefined;

  for (let page = 0; page < JOB_PAGES; page++) {
    const params: Record<string, string> = {
      q: searchQuery,
      location,
      gl,
      hl,
    };
    if (pageToken) params.next_page_token = pageToken;
    const { data, ts } = await serpApiCall("google_jobs", params);
    if (ts < fetchedAt) fetchedAt = ts;
    for (const raw of asArray(data.jobs_results)) {
      postings.push(normalizePosting(asRecord(raw)));
    }
    // Pagination token field verified against the fixture.
    const pagination = asRecord(data.serpapi_pagination);
    pageToken = asString(pagination.next_page_token) || asString(data.next_page_token) || undefined;
    if (!pageToken) break;
  }
  return { postings, fetchedAt };
}
