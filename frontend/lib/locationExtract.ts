export const UK_LOCATIONS = [
  "london",
  "manchester",
  "birmingham",
  "leeds",
  "bristol",
  "liverpool",
  "sheffield",
  "nottingham",
  "cambridge",
  "oxford",
  "cornwall",
  "devon",
];

export function extractLocation(title: string): string | null {
  const t = title.toLowerCase();

  for (const loc of UK_LOCATIONS) {
    if (t.includes(loc)) {
      return loc;
    }
  }

  const words = title.split(/\s+/).filter(Boolean);
  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z]/g, "");
    if (clean.length > 4 && clean[0] === clean[0]?.toUpperCase()) {
      return clean.toLowerCase();
    }
  }

  return null;
}

export function locationMatchesDeal(
  extracted: string,
  target: string,
): boolean {
  const a = extracted.trim().toLowerCase();
  const b = target.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/** Substring match both ways — site string vs extracted signal location (no geo distance). */
export function isNearby(
  signalLoc: string | null | undefined,
  target: string | null,
): boolean {
  if (!signalLoc || !target) return false;
  const s = signalLoc.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  return s.includes(t) || t.includes(s);
}

/** Deal relevance points: 40 same/near match, 20 regional pair, else 0. */
export function locationMatchScore(
  signalLoc: string | null,
  targetLoc: string | null,
): number {
  if (!signalLoc || !targetLoc) return 0;
  const s = signalLoc.trim().toLowerCase();
  const t = targetLoc.trim().toLowerCase();
  if (s === t || s.includes(t) || t.includes(s)) return 40;
  if (
    (s === "manchester" && t === "liverpool") ||
    (s === "liverpool" && t === "manchester") ||
    (s === "london" && t === "cambridge") ||
    (s === "cambridge" && t === "london")
  ) {
    return 20;
  }
  return 0;
}
