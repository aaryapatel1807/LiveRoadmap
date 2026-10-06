// Roadmap pipeline (project brief, section 5): fetch -> extract -> rank ->
// order -> enrich -> render-ready Roadmap JSON.

import skillsJson from "../data/skills.json";
import { ROLES, LOCATION, type RoleDef } from "./roles";
import { fetchJobsForRole } from "./jobs";
import { fetchResourcesForSkill } from "./resources";
import { extractSkills } from "./extract";
import { rankSkills, orderSkills, toRoadmapNodes, validateDictionary } from "./rank";
import type { Roadmap, RoleId, SkillDef } from "./types";

const SKILLS = (skillsJson as { skills: SkillDef[] }).skills;

validateDictionary(SKILLS);

export function getRoleDef(roleId: string): RoleDef & { id: RoleId } {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) {
    throw new Error(`Unknown role "${roleId}". Valid roles: ${ROLES.map((r) => r.id).join(", ")}`);
  }
  return role as RoleDef & { id: RoleId };
}

export function listRoles(): { id: string; label: string; chips: string[] }[] {
  return ROLES.map((r) => ({ id: r.id, label: r.label, chips: r.chips }));
}

export async function buildRoadmap(roleId: RoleId): Promise<Roadmap> {
  const role = getRoleDef(roleId);

  // Fetch: up to JOB_PAGES of Google Jobs, India.
  const { postings: rawPostings, fetchedAt } = await fetchJobsForRole(role.searchQuery, LOCATION);

  // Extract + rank + order.
  const { postings, counts } = extractSkills(SKILLS, rawPostings);
  const kept = rankSkills(SKILLS, counts, postings.length);
  const { nodes, edges } = orderSkills(SKILLS, kept);
  const roadmapNodes = toRoadmapNodes(nodes);

  // Enrich: YouTube resources for the top 10 non-inferred skills.
  const enrichable = roadmapNodes.filter((n) => !n.inferred).slice(0, 10);
  const resources = new Map<string, Awaited<ReturnType<typeof fetchResourcesForSkill>>>();
  await Promise.all(
    enrichable.map(async (n) => {
      resources.set(n.id, await fetchResourcesForSkill(n.label));
    })
  );

  return {
    role: roleId,
    location: LOCATION,
    fetchedAt,
    postingsAnalyzed: postings.length,
    nodes: roadmapNodes.map((n) => ({ ...n, resources: resources.get(n.id) ?? [] })),
    edges,
  };
}
