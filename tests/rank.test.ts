import { describe, expect, it } from "vitest";
import { rankSkills, orderSkills, validateDictionary, toRoadmapNodes } from "../lib/rank";
import { MAX_NODES, MIN_DEMAND_PCT } from "../lib/config";
import type { SkillDef } from "../lib/types";

const dict: SkillDef[] = [
  { id: "a", label: "A", aliases: ["a"], category: "x", prereqs: [] },
  { id: "b", label: "B", aliases: ["b"], category: "x", prereqs: ["a"] },
  { id: "c", label: "C", aliases: ["c"], category: "x", prereqs: ["b"] },
  { id: "rare", label: "Rare", aliases: ["rare"], category: "x", prereqs: [] },
];

describe("validateDictionary", () => {
  it("fails loudly on unknown prereq ids", () => {
    expect(() => validateDictionary([{ id: "x", label: "X", aliases: [], category: "x", prereqs: ["nope"] }])).toThrow(/unknown prereq/);
  });
  it("fails loudly on cycles", () => {
    const cyclic: SkillDef[] = [
      { id: "x", label: "X", aliases: [], category: "x", prereqs: ["y"] },
      { id: "y", label: "Y", aliases: [], category: "x", prereqs: ["x"] },
    ];
    expect(() => validateDictionary(cyclic)).toThrow(/cycle/);
  });
});

describe("rankSkills", () => {
  it("keeps skills at or above the demand threshold", () => {
    // 20 postings: "a" in 10 (50%), "rare" in 1 (5%)
    const counts = new Map([["a", 10], ["rare", 1]]);
    const ranked = rankSkills(dict, counts, 20);
    expect(ranked.some((s) => s.id === "a")).toBe(true);
    expect(ranked.some((s) => s.id === "rare")).toBe(false);
    expect(MIN_DEMAND_PCT).toBe(10);
  });
  it("computes demandPct as share of postings", () => {
    const ranked = rankSkills(dict, new Map([["a", 10]]), 20);
    expect(ranked[0].demandPct).toBe(50);
  });
  it("caps at MAX_NODES", () => {
    const bigDict: SkillDef[] = Array.from({ length: 40 }, (_, i) => ({
      id: `s${i}`, label: `S${i}`, aliases: [`s${i}`], category: "x", prereqs: [],
    }));
    const counts = new Map(bigDict.map((s) => [s.id, 20]));
    expect(rankSkills(bigDict, counts, 20)).toHaveLength(MAX_NODES);
  });
});

describe("orderSkills", () => {
  it("places prerequisites before dependents", () => {
    const kept = rankSkills(dict, new Map([["a", 20], ["b", 20], ["c", 20]]), 20);
    const { nodes } = orderSkills(dict, kept);
    const pos = new Map(nodes.map((n) => [n.id, nodes.indexOf(n)]));
    expect(pos.get("a")!).toBeLessThan(pos.get("b")!);
    expect(pos.get("b")!).toBeLessThan(pos.get("c")!);
  });
  it("adds an inferred node when a prereq was filtered out", () => {
    // "b" kept, its prereq "a" not kept -> "a" appears as inferred
    const kept = rankSkills(dict, new Map([["b", 20]]), 20);
    const { nodes, edges } = orderSkills(dict, kept);
    const inferred = nodes.find((n) => n.id === "a");
    expect(inferred?.inferred).toBe(true);
    expect(inferred?.demandPct).toBe(0);
    expect(edges).toContainEqual({ from: "a", to: "b" });
  });
  it("breaks ties by higher demandPct first", () => {
    const noPrereq: SkillDef[] = [
      { id: "x", label: "X", aliases: [], category: "x", prereqs: [] },
      { id: "y", label: "Y", aliases: [], category: "x", prereqs: [] },
    ];
    const kept = rankSkills(noPrereq, new Map([["x", 10], ["y", 18]]), 20);
    const { nodes } = orderSkills(noPrereq, kept);
    expect(nodes[0].id).toBe("y");
  });
  it("assigns sequential order via toRoadmapNodes", () => {
    const kept = rankSkills(dict, new Map([["a", 20], ["b", 20]]), 20);
    const { nodes } = orderSkills(dict, kept);
    const out = toRoadmapNodes(nodes);
    expect(out.map((n) => n.order)).toEqual([0, 1]);
    expect(out[0].id).toBe("a");
  });
});
