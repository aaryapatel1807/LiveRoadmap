"use client";

// Roadmap graph: React Flow, left-to-right layered layout, custom pastel
// glass nodes (visual language borrowed from LearnFlow). Clicking a node
// selects it for the side panel.

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Roadmap, RoadmapNode } from "@/lib/types";

export const CATEGORY_COLORS: Record<string, string> = {
  language: "#f0608a",
  frontend: "#7c6bd6",
  backend: "#4e9bd1",
  data: "#2bbfa9",
  database: "#c77e1f",
  devops: "#5b8c5a",
  tooling: "#8b7a83",
  concept: "#d6455b",
};

interface SkillNodeData {
  node: RoadmapNode;
  known: boolean;
  nextUp: boolean;
  selected: boolean;
}

function SkillNode({ data }: { data: SkillNodeData }) {
  const { node, known, nextUp, selected } = data;
  const color = CATEGORY_COLORS[node.category] ?? "#8b7a83";
  return (
    <div
      className={`rm-node ${known ? "known" : ""} ${nextUp ? "next-up" : ""} ${
        selected ? "selected" : ""
      } ${node.inferred ? "inferred" : ""}`}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flex items-start justify-between gap-2">
        <span className="rm-cat">{node.category}</span>
        <span className="rm-badge">{node.demandPct}%</span>
      </div>
      <div className="mt-1 text-sm font-bold leading-tight" style={{ color: "#262033" }}>
        {node.label}
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full" style={{ background: "#f3dce4" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, node.demandPct)}%`, background: color }}
        />
      </div>
      {node.inferred && (
        <div className="mt-1 text-[10px] italic" style={{ color: "#8b7a83" }}>
          suggested prerequisite
        </div>
      )}
      {nextUp && !known && (
        <div className="mt-1 text-[10px] font-bold" style={{ color: "#f0608a" }}>
          NEXT UP
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { skill: SkillNode };

/** Longest-path depth per node -> columns, left to right. */
function layout(roadmap: Roadmap): { nodes: Node<SkillNodeData>[]; edges: Edge[] } {
  const incoming = new Map<string, string[]>();
  for (const n of roadmap.nodes) incoming.set(n.id, []);
  for (const e of roadmap.edges) incoming.get(e.to)?.push(e.from);

  const depthMemo = new Map<string, number>();
  const depth = (id: string): number => {
    if (depthMemo.has(id)) return depthMemo.get(id)!;
    const parents = incoming.get(id) ?? [];
    const d = parents.length === 0 ? 0 : 1 + Math.max(...parents.map(depth));
    depthMemo.set(id, d);
    return d;
  };

  const columns = new Map<number, RoadmapNode[]>();
  for (const n of roadmap.nodes) {
    const d = depth(n.id);
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(n);
  }

  const X_GAP = 260;
  const Y_GAP = 118;
  const nodes: Node<SkillNodeData>[] = [];
  for (const [d, col] of [...columns.entries()].sort((a, b) => a[0] - b[0])) {
    col.sort((a, b) => b.demandPct - a.demandPct);
    col.forEach((n, i) => {
      nodes.push({
        id: n.id,
        type: "skill",
        position: { x: d * X_GAP, y: i * Y_GAP },
        data: { node: n, known: false, nextUp: false, selected: false },
      });
    });
  }

  const edges: Edge[] = roadmap.edges.map((e) => ({
    id: `${e.from}->${e.to}`,
    source: e.from,
    target: e.to,
    type: "smoothstep",
  }));
  return { nodes, edges };
}

export default function RoadmapGraph({
  roadmap,
  knownIds,
  selectedId,
  onSelect,
}: {
  roadmap: Roadmap;
  knownIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { nodes: baseNodes, edges } = useMemo(() => layout(roadmap), [roadmap]);

  // Next up: first unknown node (in topo order) whose prereqs are all known.
  const nextUpId = useMemo(() => {
    const incoming = new Map<string, string[]>();
    for (const n of roadmap.nodes) incoming.set(n.id, []);
    for (const e of roadmap.edges) incoming.get(e.to)?.push(e.from);
    const ordered = [...roadmap.nodes].sort((a, b) => a.order - b.order);
    for (const n of ordered) {
      if (knownIds.has(n.id)) continue;
      if ((incoming.get(n.id) ?? []).every((p) => knownIds.has(p))) return n.id;
    }
    return null;
  }, [roadmap, knownIds]);

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          known: knownIds.has(n.id),
          nextUp: n.id === nextUpId && !knownIds.has(n.id),
          selected: n.id === selectedId,
        },
      })),
    [baseNodes, knownIds, nextUpId, selectedId]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id === selectedId ? null : node.id)}
        onPaneClick={() => onSelect(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e8c3d1" gap={28} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
