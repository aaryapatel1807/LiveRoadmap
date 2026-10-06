// Shared data contracts (project brief, section 7).
// Keep these in sync between the API routes and the client UI.

export type RoleId = "backend" | "frontend" | "data-analyst" | "devops";

export interface SkillDef {
  id: string;
  label: string;
  aliases: string[];
  category: string;
  prereqs: string[];
  caseSensitive?: boolean;
}

export interface Resource {
  title: string;
  url: string;
  channel?: string;
  length?: string;
  views?: number;
}

export interface RoadmapNode {
  id: string;
  label: string;
  category: string;
  postingCount: number;
  demandPct: number; // 0-100, share of postings that mention the skill
  inferred: boolean; // true when added only to keep prerequisites connected
  order: number; // position from the topological sort
  resources: Resource[];
}

export interface Roadmap {
  role: RoleId;
  location: string;
  fetchedAt: string; // ISO date of the oldest cached call used
  postingsAnalyzed: number;
  nodes: RoadmapNode[];
  edges: { from: string; to: string }[];
}

/** Minimal normalized job posting fed into extraction. */
export interface Posting {
  title: string;
  company: string;
  description: string;
  highlights: string[];
}
