// YouTube resource selection (project brief, sections 5, 8).
// One search per top skill: "<label> tutorial for beginners".
// Keeps up to 3: prefers tutorial/course/crash course/beginner titles,
// higher view counts, drops results with no URL.
//
// FIELD NAMES VERIFIED 2026-10-06 against fixtures/youtube.sample.json:
// video_results[].title/link/channel{name}/length/views(number).

import { YOUTUBE_PER_SKILL } from "./config";
import { serpApiCall } from "./serpapi";
import type { Resource } from "./types";

const TITLE_HINTS = ["tutorial", "course", "crash course", "beginner", "full course"];

function scoreVideo(title: string, views?: number): number {
  const t = title.toLowerCase();
  let score = 0;
  for (const hint of TITLE_HINTS) if (t.includes(hint)) score += 10;
  if (views && views > 0) score += Math.min(5, Math.log10(views + 1));
  return score;
}

export async function fetchResourcesForSkill(skillLabel: string): Promise<Resource[]> {
  const { data } = await serpApiCall("youtube", {
    search_query: `${skillLabel} tutorial for beginners`,
  });
  const videos = (data.video_results ?? [])
    .filter((v: any) => v.link || v.url)
    .map((v: any) => ({
      title: v.title ?? "",
      url: v.link ?? v.url,
      channel: v.channel?.name ?? v.channel ?? undefined,
      length: v.length ?? undefined,
      views: typeof v.views === "number" ? v.views : undefined,
    }));
  videos.sort((a: Resource, b: Resource) => scoreVideo(b.title, b.views) - scoreVideo(a.title, a.views));
  return videos.slice(0, YOUTUBE_PER_SKILL);
}
