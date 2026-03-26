import {
  persistGeoSnapshots,
  persistSectorSnapshots,
  recomputeSectorsFromDb,
  startOfUtcDay,
} from "@/lib/signals/recompute";

/** Recompute sector scores from `RawSignal` and persist global + geo snapshots. */
export async function applySignalsPipeline(): Promise<{
  sectorCount: number;
  bucketDate: string;
}> {
  const bucket = startOfUtcDay(new Date());
  const sectors = await recomputeSectorsFromDb();
  await persistSectorSnapshots(sectors, bucket);
  await persistGeoSnapshots(sectors, bucket);
  return {
    sectorCount: sectors.length,
    bucketDate: bucket.toISOString(),
  };
}
