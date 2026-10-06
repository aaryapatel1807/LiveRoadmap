import { describe, expect, it } from "vitest";
import { extractSkills, aliasPattern } from "../lib/extract";
import type { Posting, SkillDef } from "../lib/types";

const dict: SkillDef[] = [
  { id: "javascript", label: "JavaScript", aliases: ["javascript", "js"], category: "language", prereqs: [] },
  { id: "react", label: "React", aliases: ["react", "react.js"], category: "frontend", prereqs: ["javascript"] },
  { id: "go", label: "Go", aliases: ["go", "golang"], category: "language", prereqs: [], caseSensitive: true },
  { id: "c", label: "C", aliases: ["c", "c language"], category: "language", prereqs: [], caseSensitive: true },
  { id: "python", label: "Python", aliases: ["python"], category: "language", prereqs: [] },
];

const posting = (title: string, company: string, body: string): Posting => ({
  title,
  company,
  description: body,
  highlights: [],
});

describe("aliasPattern", () => {
  it("does not match inside larger words", () => {
    expect(aliasPattern("react", false).test("Reactive programming")).toBe(false);
    expect(aliasPattern("react", false).test("We use React daily")).toBe(true);
  });
  it("matches punctuation-led aliases like .NET", () => {
    expect(aliasPattern(".net", false).test("Stack: .NET 8")).toBe(true);
  });
  it("C never matches C++ or C#", () => {
    expect(aliasPattern("C", true).test("Senior C++ engineer")).toBe(false);
    expect(aliasPattern("C", true).test("C# developer")).toBe(false);
    expect(aliasPattern("C", true).test("Embedded C firmware")).toBe(true);
  });
});

describe("extractSkills", () => {
  it("dedupes postings by title + company", () => {
    const p = posting("Backend Dev", "Acme", "Python and Python again");
    const { postings, counts } = extractSkills(dict, [p, p]);
    expect(postings).toHaveLength(1);
    expect(counts.get("python")).toBe(1);
  });
  it("counts a skill once per posting no matter how often it appears", () => {
    const { counts } = extractSkills(dict, [
      posting("Backend Dev", "Acme", "Python Python Python, also Go"),
    ]);
    expect(counts.get("python")).toBe(1);
  });
  it("caseSensitive Go needs another language term in the same posting", () => {
    const noCtx = extractSkills(dict, [posting("Ops", "Acme", "We will go far")]);
    expect(noCtx.counts.has("go")).toBe(false);
    const withCtx = extractSkills(dict, [posting("Backend Dev", "Acme", "Python services, go routines")]);
    expect(withCtx.counts.get("go")).toBe(1);
  });
  it("matches title + description + highlights together", () => {
    const p: Posting = { title: "Frontend Dev", company: "Acme", description: "Great role", highlights: ["React required"] };
    const { counts } = extractSkills(dict, [p]);
    expect(counts.get("react")).toBe(1);
  });
});
