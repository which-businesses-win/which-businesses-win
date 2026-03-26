import type { Sector } from "@/lib/sectors/types";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

/** GET /api/sectors — seed baselines + ingested `RawSignal` rows, ranked. */
export async function listSectors(): Promise<Sector[]> {
  return recomputeSectorsFromDb();
}

/** GET /api/sectors/:slug */
export async function getSectorBySlug(slug: string): Promise<Sector | undefined> {
  const rows = await listSectors();
  return rows.find((s) => s.slug === slug);
}
