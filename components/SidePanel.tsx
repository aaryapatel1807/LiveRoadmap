"use client";

// Side panel: node detail on click — demand, prerequisites, YouTube resources,
// and the skill-gap "I know this" toggle.

import type { Roadmap, RoadmapNode } from "@/lib/types";
import { CATEGORY_COLORS } from "./RoadmapGraph";

function formatViews(views?: number): string {
  if (!views) return "";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${Math.round(views / 1_000)}K views`;
  return `${views} views`;
}

export default function SidePanel({
  node,
  roadmap,
  known,
  onToggleKnown,
  onClose,
}: {
  node: RoadmapNode | null;
  roadmap: Roadmap;
  known: boolean;
  onToggleKnown: (id: string) => void;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl">🗺️</div>
        <p className="mt-4 text-sm font-semibold" style={{ color: "#4a4356" }}>
          Click a skill node
        </p>
        <p className="mt-1 text-xs" style={{ color: "#8b7a83" }}>
          Demand, prerequisites and fresh YouTube resources appear here.
        </p>
      </div>
    );
  }

  const prereqs = roadmap.edges.filter((e) => e.to === node.id).map((e) => e.from);
  const prereqLabels = prereqs.map(
    (id) => roadmap.nodes.find((n) => n.id === id)?.label ?? id
  );
  const color = CATEGORY_COLORS[node.category] ?? "#8b7a83";

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="rm-cat">{node.category}</div>
          <h2 className="mt-1 text-xl font-bold" style={{ color: "#262033" }}>
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full px-2 py-1 text-sm"
          style={{ color: "#8b7a83" }}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <div
          className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: "#ffe4ec", border: "1px solid rgba(240,96,138,.25)" }}
        >
          <div className="text-2xl font-bold" style={{ color: "#f0608a" }}>
            {node.demandPct}%
          </div>
          <div className="text-[11px]" style={{ color: "#8b7a83" }}>
            of postings mention it
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: "#fff", border: "1px solid rgba(217,79,126,.14)" }}
        >
          <div className="text-2xl font-bold" style={{ color: "#262033" }}>
            {node.postingCount}
          </div>
          <div className="text-[11px]" style={{ color: "#8b7a83" }}>
            postings analyzed
          </div>
        </div>
      </div>

      {prereqLabels.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8b7a83" }}>
            Learn first
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {prereqLabels.map((label) => (
              <span
                key={label}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#f7e9ee", color: "#4a4356" }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8b7a83" }}>
          Current YouTube resources
        </div>
        {node.resources.length === 0 ? (
          <p className="mt-2 text-xs" style={{ color: "#8b7a83" }}>
            No resources for this skill yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {node.resources.map((r, i) => (
              <li key={i}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl p-3 transition hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,.88)",
                    border: "1px solid rgba(217,79,126,.14)",
                  }}
                >
                  <div className="text-sm font-semibold leading-snug" style={{ color: "#262033" }}>
                    {r.title}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "#8b7a83" }}>
                    {[r.channel, r.length, formatViews(r.views)].filter(Boolean).join(" · ")}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={() => onToggleKnown(node.id)}
          className="w-full rounded-2xl py-3 text-sm font-bold transition"
          style={
            known
              ? { background: "#dcf7f0", color: "#0e9f8a", border: "1px solid rgba(43,191,169,.4)" }
              : { background: color, color: "#fff", boxShadow: "0 4px 16px rgba(130,105,145,.18)" }
          }
        >
          {known ? "✓ I know this — unmark" : "Mark as known"}
        </button>
      </div>
    </div>
  );
}
