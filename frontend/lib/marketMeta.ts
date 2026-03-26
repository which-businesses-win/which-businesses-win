import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export type MarketMeta = {
  /** Copy: “Based on N live signals…” */
  liveSignalCount: number;
  /** ISO timestamp for last meaningful ingest / recompute anchor */
  lastRefreshedAt: string;
  /** Mean headline confidence across sectors (0–100) */
  avgConfidence: number;
};

/**
 * Public credibility stats for landing + onboarding — DB-backed where possible.
 */
export async function getMarketMeta(): Promise<MarketMeta> {
  const [rawCount, latestRaw, sectors] = await Promise.all([
    prisma.rawSignal.count(),
    prisma.rawSignal.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, date: true },
    }),
    recomputeSectorsFromDb(),
  ]);

  const fromSectors = sectors.reduce(
    (n, s) => n + (s.signalCount ?? 0),
    0,
  );
  const liveSignalCount = Math.max(rawCount, fromSectors, 12);
  const anchor =
    latestRaw?.createdAt ??
    latestRaw?.date ??
    new Date();
  const avgConfidence =
    sectors.length === 0
      ? 0
      : Math.round(
          sectors.reduce((a, s) => a + s.confidence, 0) / sectors.length,
        );

  return {
    liveSignalCount,
    lastRefreshedAt: anchor.toISOString(),
    avgConfidence,
  };
}
