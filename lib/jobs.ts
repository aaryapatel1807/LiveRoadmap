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
import type { Posting } from "./types";

export interface JobsFetch {
  postings: Posting[];
  /** ISO date of the oldest SerpApi call used (cache mtime or now) */
  fetchedAt: string;
}

function normalizePosting(raw: any): Posting {
  const highlights: string[] = [];
  // extensions carry facts like ["15 hours ago", "Full-time"].
  for (const e of raw.extensions ?? []) {
    if (typeof e === "string") highlights.push(e);
  }
  // job_highlights was expected per the brief but is absent from the real
  // fixture; keep the mapping in case other queries return it.
  for (const h of raw.job_highlights ?? []) {
    if (typeof h === "string") highlights.push(h);
    else if (Array.isArray(h?.items)) highlights.push(`${h.title ?? ""}: ${h.items.join("; ")}`);
    else if (h?.title) highlights.push(h.title);
  }
  return {
    title: raw.title ?? raw.job_title ?? "",
    company: raw.company_name ?? "",
    description: raw.description ?? "",
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
    for (const raw of data.jobs_results ?? []) {
      postings.push(normalizePosting(raw));
    }
    // Pagination token field to be verified against the fixture.
    pageToken = data.serpapi_pagination?.next_page_token ?? data.next_page_token;
    if (!pageToken) break;
  }
  return { postings, fetchedAt };
}
