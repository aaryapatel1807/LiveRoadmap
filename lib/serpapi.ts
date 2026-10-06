// SerpApi client (project brief, sections 5-6, rule 3).
// EVERY SerpApi call in this project goes through serpApiCall. Never add a
// direct fetch to SerpApi anywhere else.
//
// - Cache-first: key = engine + sorted params, stored under .cache/serpapi/.
// - Every real call is appended to .cache/credit-log.jsonl with a running count.
// - When CACHE_ONLY=true, a cache miss throws instead of calling the API.
// - The key is server-only (process.env.SERPAPI_KEY). It never reaches the browser.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, appendFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const CACHE_ONLY = process.env.CACHE_ONLY === "true";
const CACHE_DIR = join(process.cwd(), ".cache", "serpapi");
const CREDIT_LOG = join(process.cwd(), ".cache", "credit-log.jsonl");

export interface SerpApiResult {
  data: any;
  /** true when served from cache; false when it cost a real credit */
  cached: boolean;
  /** ISO timestamp of the response: cache file mtime on hit, now on miss */
  ts: string;
}

function cacheKey(engine: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const hash = createHash("sha256").update(`${engine}|${sorted}`).digest("hex").slice(0, 16);
  return join(CACHE_DIR, `${engine}-${hash}.json`);
}

function logCredit(engine: string, params: Record<string, string>): number {
  mkdirSync(join(process.cwd(), ".cache"), { recursive: true });
  const entry = { ts: new Date().toISOString(), engine, params, cost: 1 };
  appendFileSync(CREDIT_LOG, JSON.stringify(entry) + "\n");
  return readFileSync(CREDIT_LOG, "utf8").trim().split("\n").length;
}

export async function serpApiCall(engine: string, params: Record<string, string>): Promise<SerpApiResult> {
  const file = cacheKey(engine, params);
  if (existsSync(file)) {
    const ts = statSync(file).mtime.toISOString();
    return { data: JSON.parse(readFileSync(file, "utf8")), cached: true, ts };
  }
  if (CACHE_ONLY) {
    throw new Error(
      `CACHE_ONLY=true and no cached response for ${engine} ${JSON.stringify(params)}. ` +
        `Run scripts/prewarm.ts with a live key first.`
    );
  }
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY is not set. Copy .env.example to .env and set it.");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", engine);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", key); // server-side only; the key never reaches the browser
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 300));
    throw new Error(`SerpApi ${engine} HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
  const n = logCredit(engine, params);
  console.log(`[serpapi] live call #${n}: ${engine} (cached for next time)`);
  return { data, cached: false, ts: new Date().toISOString() };
}
