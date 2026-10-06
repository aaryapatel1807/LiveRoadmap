// Skill extraction (project brief, section 8). Deterministic: no LLM, no
// invented fields. Works on normalized postings; SerpApi field mapping
// happens in the jobs fetcher (Phase 1) against /fixtures.

import type { Posting, SkillDef } from "./types";

export interface ExtractionResult {
  /** postings after dedupe */
  postings: Posting[];
  /** skill id -> number of postings that mention it (once per posting max) */
  counts: Map<string, number>;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a boundary-safe matcher for one alias.
 * (?<!\w) / (?!\w) are used instead of \b so aliases starting with
 * punctuation (".NET", "C++") still match. Single-letter aliases get a
 * (?!\+|#) guard so "C" never matches "C++" / "C#".
 */
export function aliasPattern(alias: string, caseSensitive: boolean): RegExp {
  const escaped = escapeRegExp(alias);
  const single = /^[A-Za-z]$/.test(alias);
  const src = `(?<!\\w)${escaped}${single ? "(?!\\+|#)" : ""}(?!\\w)`;
  return new RegExp(src, caseSensitive ? "" : "i");
}

/** Aliases of every language skill except the one being tested. */
function languageContextTerms(dict: SkillDef[], excludeId: string): RegExp[] {
  return dict
    .filter((s) => s.category === "language" && s.id !== excludeId)
    .flatMap((s) => s.aliases.map((a) => aliasPattern(a, false)));
}

export function extractSkills(dict: SkillDef[], rawPostings: Posting[]): ExtractionResult {
  // 1. Dedupe by title + company.
  const seen = new Set<string>();
  const postings: Posting[] = [];
  for (const p of rawPostings) {
    const key = `${p.title.trim().toLowerCase()}|${p.company.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      postings.push(p);
    }
  }

  // Precompile matchers.
  const matchers = dict.map((skill) => ({
    skill,
    patterns: skill.aliases.map((a) => aliasPattern(a, !!skill.caseSensitive)),
  }));
  const context = new Map<string, RegExp[]>();

  const counts = new Map<string, number>();
  for (const p of postings) {
    // 2. One text blob per posting.
    const blob = [p.title, p.description, ...p.highlights].join("\n");
    for (const { skill, patterns } of matchers) {
      // 4. A skill counts once per posting, no matter how often it appears.
      const hit = patterns.some((re) => re.test(blob));
      if (!hit) continue;
      // 3b. Case-sensitive aliases need a programming-language context term
      //     in the same posting to avoid false hits ("go" vs "going" etc.).
      if (skill.caseSensitive) {
        let ctx = context.get(skill.id);
        if (!ctx) {
          ctx = languageContextTerms(dict, skill.id);
          context.set(skill.id, ctx);
        }
        if (!ctx.some((re) => re.test(blob))) continue;
      }
      counts.set(skill.id, (counts.get(skill.id) ?? 0) + 1);
    }
  }

  return { postings, counts };
}
