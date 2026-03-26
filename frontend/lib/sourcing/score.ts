import { getSignalLabel } from "@/lib/marketSignalsBoard";
import type { Sector } from "@/lib/sectors/types";

/** Map IRR (typical 8–25%) to 0–100 for blending. */
export function irrToScore(adjustedIRR: number): number {
  return Math.max(0, Math.min(100, ((adjustedIRR - 5) / 22) * 100));
}

/**
 * Portfolio fit — penalise crowded sleeves, reward new exposure.
 */
export function calculateFitScore(
  sectorLabel: string,
  exposureBySector: Record<string, number>,
): number {
  let score = 50;
  const exp = exposureBySector[sectorLabel] ?? 0;
  if (exp > 0.4) score -= 15;
  if (exp === 0) score += 20;
  return Math.max(0, Math.min(100, score));
}

/**
 * Simple risk stack: planning friction, delivery friction, market volatility (0–100 each).
 */
export function calculateRiskScore(
  sector: Sector,
  marketVolatility01: number,
): number {
  const planningRisk = 100 - sector.signals.planning.score;
  const deliveryRisk = 100 - sector.signals.delivery.score;
  const marketVol = Math.max(0, Math.min(100, marketVolatility01 * 100));
  return (
    planningRisk * 0.4 + deliveryRisk * 0.3 + marketVol * 0.3
  );
}

/** marketVolatility01: 0–1 from portfolio bear/base spread. */
export function volatilityFromPortfolioDownside(downsideVsBasePp: number): number {
  return Math.min(1, Math.max(0, downsideVsBasePp / 12));
}

/**
 * Overall rank — same weights as spec; `adjustedIRR` is mapped to 0–100 via `irrToScore`
 * so it blends with fit / sector / risk (raw % points are different scales).
 */
export function calculateOverallScore(
  adjustedIRR: number,
  fitScore: number,
  sectorHeadlineScore: number,
  riskScore: number,
): number {
  const irrN = irrToScore(adjustedIRR);
  return (
    irrN * 0.4 +
    fitScore * 0.25 +
    sectorHeadlineScore * 0.2 +
    (100 - riskScore) * 0.15
  );
}

export function headlineLabelForSector(sector: Sector): string {
  return getSignalLabel(sector.score).label;
}
