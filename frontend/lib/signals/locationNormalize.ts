/**
 * Canonical UK cities for v1 geo scores (5–10 max — avoid postcode sprawl).
 */
export const CANONICAL_UK_CITIES = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Bristol",
  "Liverpool",
  "Edinburgh",
] as const;

export type CanonicalCity = (typeof CANONICAL_UK_CITIES)[number];

export type LocationType = "city" | "region" | "national";

/** AI and ingest aliases → canonical display name */
const LOCATION_MAP: Record<string, string> = {
  uk: "UK",
  "united kingdom": "UK",
  england: "UK",
  britain: "UK",
  nationwide: "UK",
  national: "UK",

  london: "London",
  "greater london": "London",
  "inner london": "London",
  "outer london": "London",
  camden: "London",
  westminster: "London",
  canary: "London",
  "tower hamlets": "London",

  manchester: "Manchester",
  "greater manchester": "Manchester",
  salford: "Manchester",
  "manchester city centre": "Manchester",

  birmingham: "Birmingham",
  "west midlands": "Birmingham",
  wolverhampton: "Birmingham",

  leeds: "Leeds",
  "west yorkshire": "Leeds",
  bradford: "Leeds",

  bristol: "Bristol",
  "bristol city": "Bristol",

  liverpool: "Liverpool",
  "merseyside": "Liverpool",

  edinburgh: "Edinburgh",
  "edinburgh city": "Edinburgh",
};

/**
 * Normalise messy AI strings to a canonical city key, or "UK" for national,
 * or `null` when we cannot place the signal (falls back to national-only scoring).
 */
export function normalizeLocationName(raw: string | undefined | null): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const k = raw.trim().toLowerCase();
  if (LOCATION_MAP[k]) return LOCATION_MAP[k];
  const compact = k.replace(/[^a-z0-9]+/g, " ").trim();
  if (LOCATION_MAP[compact]) return LOCATION_MAP[compact];
  for (const city of CANONICAL_UK_CITIES) {
    if (city.toLowerCase() === k) return city;
  }
  return null;
}

/** True when signal should use full global pillar weight (no city bucket). */
export function isNationalLocation(
  type: LocationType | undefined,
  canonical: string | null,
): boolean {
  if (!type || type === "national") return true;
  if (canonical === "UK" || canonical === null) return true;
  return false;
}

/**
 * Map AI `location` to stored DB fields (canonical city name or UK + national).
 */
export function normalizeLocationForStorage(input: {
  name: string;
  type: string;
}): { locationName: string; locationType: LocationType } {
  const type =
    input.type === "city" || input.type === "region" || input.type === "national"
      ? input.type
      : "national";

  const canonical = normalizeLocationName(input.name);
  if (type === "national" || canonical === "UK") {
    return { locationName: "UK", locationType: "national" };
  }
  if (canonical && canonical !== "UK") {
    return { locationName: canonical, locationType: type === "region" ? "region" : "city" };
  }
  return { locationName: "UK", locationType: "national" };
}
