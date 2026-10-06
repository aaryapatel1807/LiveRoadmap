"use client";

// Roadmap view: role -> graph + side panel + skill-gap mode.
// Gap state lives in localStorage (no accounts). ?mock=1 loads the clearly
// labeled dev placeholder instead of /api/roadmap.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import RoadmapGraph from "@/components/RoadmapGraph";
import SidePanel from "@/components/SidePanel";
import { ROLES } from "@/lib/roles";
import type { Roadmap } from "@/lib/types";

function knownKey(role: string): string {
  return `liveroadmap:known:${role}`;
}

export default function RoadmapPage() {
  const params = useParams();
  const search = useSearchParams();
  const role = String(params.role ?? "");
  const useMock = search.get("mock") === "1";

  const roleDef = ROLES.find((r) => r.id === role);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gapMode, setGapMode] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(knownKey(role));
      if (raw) setKnownIds(new Set(JSON.parse(raw)));
    } catch {
      /* ignore corrupt storage */
    }
  }, [role]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = useMock
      ? `/dev-mock/roadmap.${role}.mock.json`
      : `/api/roadmap?role=${encodeURIComponent(role)}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: Roadmap) => {
        setRoadmap(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [role, useMock]);

  const toggleKnown = useCallback(
    (id: string) => {
      setKnownIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(knownKey(role), JSON.stringify([...next]));
        return next;
      });
    },
    [role]
  );

  const selectedNode = useMemo(
    () => roadmap?.nodes.find((n) => n.id === selectedId) ?? null,
    [roadmap, selectedId]
  );

  const progress = roadmap ? `${knownIds.size} / ${roadmap.nodes.length}` : "";

  if (!roleDef) {
    return (
      <main className="mx-auto max-w-2xl p-10 text-center">
        <h1 className="text-2xl font-bold">Unknown role</h1>
        <p className="mt-2 text-sm">Pick one of: {ROLES.map((r) => r.id).join(", ")}</p>
        <Link href="/" className="mt-4 inline-block underline">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b px-5 py-3" style={{ borderColor: "rgba(217,79,126,.14)", background: "rgba(255,255,255,.72)", backdropFilter: "blur(12px)" }}>
        <Link href="/" className="text-sm font-bold" style={{ color: "#f0608a" }}>
          ← Roles
        </Link>
        <div>
          <h1 className="text-lg font-bold leading-tight">{roleDef.label}</h1>
          <p className="text-xs" style={{ color: "#8b7a83" }}>
            {roadmap
              ? `${roadmap.postingsAnalyzed} live postings · India · updated ${new Date(roadmap.fetchedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              : "Loading roadmap…"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {useMock && (
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#ffefd6", color: "#c77e1f" }}>
              placeholder data (dev)
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold" style={{ color: "#4a4356" }}>
            <input
              type="checkbox"
              checked={gapMode}
              onChange={(e) => setGapMode(e.target.checked)}
              className="h-4 w-4 accent-[#f0608a]"
            />
            Skill-gap mode
          </label>
          {gapMode && roadmap && (
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#ffe4ec", color: "#f0608a" }}>
              {progress} known
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f3dce4] border-t-[#f0608a]" />
                <p className="mt-4 text-sm" style={{ color: "#8b7a83" }}>
                  Building your roadmap from live job postings…
                </p>
              </div>
            </div>
          )}
          {error && !loading && (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="text-4xl">⚠️</div>
                <h2 className="mt-3 text-lg font-bold">Couldn't load this roadmap</h2>
                <p className="mt-2 text-sm" style={{ color: "#8b7a83" }}>
                  {error}
                </p>
                <p className="mt-2 text-xs" style={{ color: "#8b7a83" }}>
                  Tip: append <code>?mock=1</code> to preview the UI with placeholder data.
                </p>
              </div>
            </div>
          )}
          {roadmap && !loading && (
            <RoadmapGraph
              roadmap={roadmap}
              knownIds={gapMode ? knownIds : new Set()}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
        <aside
          className="w-[340px] shrink-0 border-l"
          style={{ borderColor: "rgba(217,79,126,.14)", background: "rgba(255,255,255,.82)", backdropFilter: "blur(16px)" }}
        >
          {roadmap ? (
            <SidePanel
              node={selectedNode}
              roadmap={roadmap}
              known={selectedId ? knownIds.has(selectedId) : false}
              onToggleKnown={toggleKnown}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </aside>
      </div>
    </main>
  );
}
