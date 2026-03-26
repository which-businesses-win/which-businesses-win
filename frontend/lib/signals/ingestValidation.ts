import type { LocationType } from "@/lib/signals/locationNormalize";
import type { RawSignalIngestInput, SignalCategory } from "@/lib/signals/types";

const CATEGORIES: SignalCategory[] = [
  "planning",
  "capital",
  "demand",
  "regulation",
  "delivery",
];

function isCategory(s: string): s is SignalCategory {
  return (CATEGORIES as string[]).includes(s);
}

/**
 * Parse and validate POST /api/signals/ingest body.
 * Returns `null` if invalid.
 */
export function parseRawSignalIngest(body: unknown): RawSignalIngestInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  const source = typeof o.source === "string" ? o.source.trim() : "";
  const summary = typeof o.summary === "string" ? o.summary.trim() : "";
  const dateRaw = typeof o.date === "string" ? o.date.trim() : "";
  const catRaw = typeof o.category === "string" ? o.category.trim() : "";

  if (!title || !source || !summary || !dateRaw || !catRaw) return null;
  if (!isCategory(catRaw)) return null;

  const sentiment =
    typeof o.sentiment === "number" && Number.isFinite(o.sentiment)
      ? o.sentiment
      : undefined;
  const strength =
    typeof o.strength === "number" && Number.isFinite(o.strength)
      ? o.strength
      : undefined;
  if (sentiment === undefined || strength === undefined) return null;
  if (sentiment < -1 || sentiment > 1) return null;
  if (strength < 1 || strength > 100) return null;

  if (!Array.isArray(o.sectors) || o.sectors.length === 0) return null;
  const sectors: string[] = [];
  for (const x of o.sectors) {
    if (typeof x !== "string" || !x.trim()) return null;
    sectors.push(x);
  }

  const d = new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return null;

  const id =
    typeof o.id === "string" && o.id.trim() ? o.id.trim() : undefined;

  let location: { name: string; type: LocationType } | undefined;
  if (o.location != null) {
    if (typeof o.location !== "object" || Array.isArray(o.location)) {
      return null;
    }
    const L = o.location as Record<string, unknown>;
    const ln = typeof L.name === "string" ? L.name.trim() : "";
    const lt = typeof L.type === "string" ? L.type.trim() : "";
    if (
      !ln ||
      (lt !== "city" && lt !== "region" && lt !== "national")
    ) {
      return null;
    }
    location = { name: ln, type: lt };
  }

  return {
    ...(id ? { id } : {}),
    title,
    source,
    date: d.toISOString(),
    category: catRaw,
    sentiment,
    strength,
    sectors,
    summary,
    ...(location ? { location } : {}),
  };
}
