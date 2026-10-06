// Small safe-access helpers for untyped SerpApi JSON (keeps `any` out of
// the codebase so `npm run lint` stays clean).

export type JsonRecord = { [key: string]: unknown };

export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export function asRecord(v: unknown): JsonRecord {
  return typeof v === "object" && v !== null ? (v as JsonRecord) : {};
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function asNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
