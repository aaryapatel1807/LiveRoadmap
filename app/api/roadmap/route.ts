// GET /api/roadmap?role=<RoleId> -> Roadmap JSON (project brief, section 7).
// Cache-first: .cache/roadmap.<role>.json from scripts/prewarm.ts. A live
// build happens only when the cache is missing AND CACHE_ONLY is not set.

import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildRoadmap, getRoleDef, listRoles } from "@/lib/pipeline";
import { CACHE_ONLY } from "@/lib/serpapi";

function cacheFile(role: string): string {
  return join(process.cwd(), ".cache", `roadmap.${role}.json`);
}

export async function GET(req: Request): Promise<NextResponse> {
  const role = new URL(req.url).searchParams.get("role") ?? "";

  let roleDef;
  try {
    roleDef = getRoleDef(role);
  } catch {
    return NextResponse.json(
      { error: `Invalid role "${role}". Valid roles: ${listRoles().map((r) => r.id).join(", ")}` },
      { status: 400 }
    );
  }

  const file = cacheFile(roleDef.id);
  if (existsSync(file)) {
    return NextResponse.json(JSON.parse(readFileSync(file, "utf8")));
  }
  if (CACHE_ONLY) {
    return NextResponse.json(
      { error: `No cached roadmap for "${role}". Run scripts/prewarm.ts with a live key first.` },
      { status: 503 }
    );
  }
  const roadmap = await buildRoadmap(roleDef.id);
  mkdirSync(join(process.cwd(), ".cache"), { recursive: true });
  writeFileSync(file, JSON.stringify(roadmap, null, 2));
  return NextResponse.json(roadmap);
}
