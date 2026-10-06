/**
 * scripts/prewarm.ts — one-off Phase 1 script.
 * Runs the full pipeline for all four roles ONCE with a live key, writing
 * .cache/roadmap.<role>.json. After this, set CACHE_ONLY=true: the UI can
 * never trigger an uncached search during the demo (brief sections 5-6).
 *
 * Usage:  SERPAPI_KEY=... npx tsx scripts/prewarm.ts
 * Budget: ~13 searches per role, ~52 total of the 250/month free plan.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildRoadmap, listRoles } from "../lib/pipeline";

async function main() {
  mkdirSync(join(process.cwd(), ".cache"), { recursive: true });
  for (const role of listRoles()) {
    console.log(`\n[prewarm] role: ${role.id}`);
    const roadmap = await buildRoadmap(role.id as any);
    const file = join(process.cwd(), ".cache", `roadmap.${role.id}.json`);
    writeFileSync(file, JSON.stringify(roadmap, null, 2));
    console.log(
      `[prewarm] ${role.id}: ${roadmap.postingsAnalyzed} postings, ${roadmap.nodes.length} nodes -> ${file}`
    );
  }
  console.log("\n[prewarm] done. Set CACHE_ONLY=true in .env for demo mode.");
}

main().catch((e) => {
  console.error("[prewarm] failed:", e.message);
  process.exit(1);
});
