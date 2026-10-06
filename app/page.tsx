"use client";

// Landing: pick a target role. Roadmaps are rebuilt from today's postings,
// so the learning order tracks live hiring demand.

import Link from "next/link";
import { ROLES } from "@/lib/roles";

const ROLE_GRADIENTS: Record<string, string> = {
  backend: "linear-gradient(135deg, #ffe4ec, #f7e9ee)",
  frontend: "linear-gradient(135deg, #e9e4fb, #f3eefa)",
  "data-analyst": "linear-gradient(135deg, #dcf7f0, #eefaf6)",
  devops: "linear-gradient(135deg, #ffefd6, #fdf3e3)",
};

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="text-center">
        <div className="rm-cat">Built with live search data · SerpApi</div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "#262033" }}>
          Don&apos;t guess what to learn.
          <br />
          <span style={{ color: "#f0608a" }}>Follow today&apos;s job postings.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base" style={{ color: "#4a4356" }}>
          LiveRoadmap turns current job listings into a learning roadmap: pick a
          target role, see which skills employers actually ask for, learn them in
          prerequisite order, and fill your gaps with fresh YouTube resources.
        </p>
      </div>

      <h2 className="mt-12 text-sm font-bold uppercase tracking-widest" style={{ color: "#8b7a83" }}>
        Pick your target role
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {ROLES.map((role) => (
          <Link
            key={role.id}
            href={`/roadmap/${role.id}`}
            className="group rounded-[20px] p-6 transition hover:-translate-y-1"
            style={{
              background: ROLE_GRADIENTS[role.id] ?? "#fff",
              border: "1px solid rgba(217,79,126,.14)",
              boxShadow: "0 4px 16px rgba(130,105,145,.10)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold" style={{ color: "#262033" }}>
                {role.label}
              </h3>
              <span className="text-xl transition group-hover:translate-x-1">→</span>
            </div>
            <p className="mt-1 text-xs font-semibold" style={{ color: "#8b7a83" }}>
              India · rebuilt from live postings
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {role.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold"
                  style={{ color: "#4a4356", border: "1px solid rgba(217,79,126,.12)" }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div
        className="mt-12 rounded-[20px] p-6"
        style={{ background: "rgba(255,255,255,.88)", border: "1px solid rgba(217,79,126,.14)" }}
      >
        <h3 className="text-sm font-bold" style={{ color: "#262033" }}>
          How it works
        </h3>
        <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-4" style={{ color: "#4a4356" }}>
          <li><span className="rm-badge">1</span> <span className="ml-1">Google Jobs listings fetched via SerpApi</span></li>
          <li><span className="rm-badge">2</span> <span className="ml-1">Skills counted and ranked by demand %</span></li>
          <li><span className="rm-badge">3</span> <span className="ml-1">Ordered by prerequisites into a node tree</span></li>
          <li><span className="rm-badge">4</span> <span className="ml-1">Each node gets current YouTube resources</span></li>
        </ol>
      </div>
    </main>
  );
}
