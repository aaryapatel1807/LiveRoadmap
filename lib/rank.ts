// Ranking and prerequisite ordering (project brief, section 8).
// demandPct = postingCount / postingsAnalyzed * 100; keep >= MIN_DEMAND_PCT,
// cap at MAX_NODES; topological sort (Kahn), ties broken by higher demand;
// missing prerequisites are added as inferred nodes; cycles fail loudly.

import { MAX_NODES, MIN_DEMAND_PCT } from "./config";
import type { RoadmapNode, SkillDef } from "./types";

export interface RankedSkill {
  id: string;
  label: string;
  category: string;
  postingCount: number;
  demandPct: number;
  inferred: boolean;
}

/** Fail loudly on data bugs: unknown prereq ids or cycles in the dictionary. */
export function validateDictionary(dict: SkillDef[]): void {
  const ids = new Set(dict.map((s) => s.id));
  for (const s of dict) {
    for (const pre of s.prereqs) {
      if (!ids.has(pre)) {
        throw new Error(`Dictionary bug: skill "${s.id}" lists unknown prereq "${pre}"`);
      }
    }
  }
  // Cycle check over the full dictionary graph.
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  const byId = new Map(dict.map((s) => [s.id, s]));
  const visit = (id: string, stack: string[]): void => {
    color.set(id, GRAY);
    for (const pre of byId.get(id)!.prereqs) {
      if (color.get(pre) === GRAY) {
        throw new Error(`Dictionary bug: prerequisite cycle: ${[...stack, id, pre].join(" -> ")}`);
      }
      if ((color.get(pre) ?? WHITE) === WHITE) visit(pre, [...stack, id]);
    }
    color.set(id, BLACK);
  };
  for (const s of dict) {
    if ((color.get(s.id) ?? WHITE) === WHITE) visit(s.id, []);
  }
}

/** Apply threshold and cap; returns kept ids ordered by demand desc. */
export function rankSkills(
  dict: SkillDef[],
  counts: Map<string, number>,
  postingsAnalyzed: number
): RankedSkill[] {
  const byId = new Map(dict.map((s) => [s.id, s]));
  const ranked: RankedSkill[] = [];
  for (const [id, postingCount] of counts) {
    const def = byId.get(id);
    if (!def) continue;
    const demandPct = (postingCount / postingsAnalyzed) * 100;
    if (demandPct < MIN_DEMAND_PCT) continue;
    ranked.push({ id, label: def.label, category: def.category, postingCount, demandPct, inferred: false });
  }
  ranked.sort((a, b) => b.demandPct - a.demandPct || b.postingCount - a.postingCount);
  return ranked.slice(0, MAX_NODES);
}

/**
 * Order kept skills by prerequisites. Missing prereqs are added as inferred
 * nodes (postingCount 0, demandPct 0) so the tree stays connected.
 * Returns nodes with `order` set and the prerequisite edges.
 */
export function orderSkills(dict: SkillDef[], kept: RankedSkill[]): { nodes: RankedSkill[]; edges: { from: string; to: string }[] } {
  const byId = new Map(dict.map((s) => [s.id, s]));
  const nodes = new Map<string, RankedSkill>(kept.map((k) => [k.id, k]));
  const edges: { from: string; to: string }[] = [];

  // Add inferred nodes for kept skills whose prereqs were filtered out.
  // Repeat until closure: an inferred node can itself have missing prereqs.
  const queue = [...kept];
  while (queue.length) {
    const cur = queue.shift()!;
    const def = byId.get(cur.id);
    if (!def) continue;
    for (const pre of def.prereqs) {
      const preDef = byId.get(pre);
      if (!preDef) continue;
      edges.push({ from: pre, to: cur.id });
      if (!nodes.has(pre)) {
        const inferred: RankedSkill = {
          id: pre,
          label: preDef.label,
          category: preDef.category,
          postingCount: 0,
          demandPct: 0,
          inferred: true,
        };
        nodes.set(pre, inferred);
        queue.push(inferred);
      }
    }
  }

  // Kahn's algorithm; among ready nodes pick the highest demandPct first.
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of nodes.keys()) {
    inDegree.set(id, 0);
    outgoing.set(id, []);
  }
  for (const e of edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    outgoing.get(e.from)!.push(e.to);
  }
  const ready = [...nodes.values()].filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  const ordered: RankedSkill[] = [];
  while (ready.length) {
    ready.sort((a, b) => b.demandPct - a.demandPct);
    const n = ready.shift()!;
    ordered.push(n);
    for (const next of outgoing.get(n.id)!) {
      inDegree.set(next, inDegree.get(next)! - 1);
      if (inDegree.get(next) === 0) ready.push(nodes.get(next)!);
    }
  }
  if (ordered.length !== nodes.size) {
    const stuck = [...nodes.keys()].filter((id) => !ordered.some((n) => n.id === id));
    throw new Error(`Prerequisite cycle among kept skills: ${stuck.join(", ")}`);
  }
  return { nodes: ordered, edges };
}

/** Convenience: full node list with `order` assigned (no resources yet). */
export function toRoadmapNodes(ordered: RankedSkill[]): Omit<RoadmapNode, "resources">[] {
  return ordered.map((s, i) => ({
    id: s.id,
    label: s.label,
    category: s.category,
    postingCount: s.postingCount,
    demandPct: Math.round(s.demandPct * 10) / 10,
    inferred: s.inferred,
    order: i,
  }));
}

// Re-export so tests can assert the threshold/cap constants came from config.
export { MIN_DEMAND_PCT, MAX_NODES };
