/**
 * UK-style planning friction → time, density, and success risk.
 * Directionally right, not actuarial — explainable in a credit memo.
 *
 * PlanSureAI should combine with deal base IRR / GDV as:
 *   irrAfterDelay = baseIrr + irrDelayImpactPoints   (points are negative when delay > 0)
 *   irrPlanningAdjusted = irrAfterDelay * (1 - riskPenalty)
 *   gdvAdjusted = baseGdv * (1 + densityAdjustment)
 */

export const DELAY_IRR_POINTS_PER_MONTH = 0.15;

export type PlanningMechanicalEffects = {
  delayMonths: number;
  /** Fractional change to gross development value / scheme size (e.g. -0.1 = -10%). */
  densityAdjustment: number;
  /** 0–1 weight on planning success; applied as (1 - riskPenalty) to IRR after delay. */
  riskPenalty: number;
};

export function effectsFromRiskLevel(
  riskLevel: "HIGH" | "MEDIUM" | "LOW",
): PlanningMechanicalEffects {
  let delayMonths = 0;
  let densityAdjustment = 0;
  let riskPenalty = 0;

  if (riskLevel === "HIGH") {
    delayMonths += 6;
    densityAdjustment -= 0.1;
    riskPenalty += 0.15;
  } else if (riskLevel === "MEDIUM") {
    delayMonths += 3;
    densityAdjustment -= 0.05;
    riskPenalty += 0.08;
  }

  return { delayMonths, densityAdjustment, riskPenalty };
}

/** IRR percentage points from programme delay (negative when delayMonths > 0). */
export function irrDelayImpactPoints(delayMonths: number): number {
  return -delayMonths * DELAY_IRR_POINTS_PER_MONTH;
}

export function effectDriverLines(e: PlanningMechanicalEffects): string[] {
  const lines: string[] = [];
  if (e.delayMonths > 0) {
    lines.push(
      `Indicative programme delay from planning friction: ~${e.delayMonths} months`,
    );
  }
  if (e.densityAdjustment !== 0) {
    lines.push(
      `Indicative density / GDV sensitivity: ${Math.round(e.densityAdjustment * 100)}%`,
    );
  }
  if (e.riskPenalty > 0) {
    lines.push(
      `Planning success risk weighting (illustrative): ~${Math.round(e.riskPenalty * 100)}%`,
    );
  }
  return lines;
}
