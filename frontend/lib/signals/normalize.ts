/** Canonical sector slugs used in `lib/sectors/seed` */
export const CANONICAL_SECTOR_SLUGS = [
  "grid-batteries",
  "uk-housebuilders",
  "build-to-rent",
  "small-landlords",
  "high-street-retail",
] as const;

const ALIASES: Record<string, string> = {
  btr: "build-to-rent",
  "build-to-rent": "build-to-rent",
  housebuilders: "uk-housebuilders",
  "uk-housebuilders": "uk-housebuilders",
  "grid-batteries": "grid-batteries",
  batteries: "grid-batteries",
  "grid batteries": "grid-batteries",
  landlords: "small-landlords",
  "small-landlords": "small-landlords",
  retail: "high-street-retail",
  "high-street-retail": "high-street-retail",
  "high street retail": "high-street-retail",
  /** Coarse proxy for logistics / industrial CRE — v1 simplification */
  industrial: "uk-housebuilders",
  energy: "grid-batteries",
};

export function normalizeSectorSlug(raw: string): string | null {
  const k = raw.trim().toLowerCase();
  if (CANONICAL_SECTOR_SLUGS.includes(k as (typeof CANONICAL_SECTOR_SLUGS)[number])) {
    return k;
  }
  return ALIASES[k] ?? null;
}

export function normalizeSectorSlugs(raw: string[]): string[] {
  const out = new Set<string>();
  for (const r of raw) {
    const n = normalizeSectorSlug(r);
    if (n) out.add(n);
  }
  return [...out];
}
