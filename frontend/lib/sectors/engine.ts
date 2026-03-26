import type { Sector, SignalBreakdown } from "@/lib/sectors/types";

/**
 * Headline score from five-pillar breakdown — explainable weights.
 */
export function calculateScore(signals: SignalBreakdown): number {
  return Math.round(
    signals.planning.score * 0.25 +
      signals.capital.score * 0.25 +
      signals.demand.score * 0.2 +
      signals.regulation.score * 0.15 +
      signals.delivery.score * 0.15,
  );
}

/** Sort by score descending, then assign rank 1..n */
export function assignRanks(sectors: Sector[]): Sector[] {
  const sorted = [...sectors].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const db = b.delta ?? -Infinity;
    const da = a.delta ?? -Infinity;
    return db - da;
  });
  return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
}
