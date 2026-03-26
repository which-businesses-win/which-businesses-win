/**
 * Base / Downside / Stressed — structured uncertainty for credit-style review.
 * Not a forecast: transparent assumptions lenders can challenge.
 */

export type LenderScenario = {
  irr: number;
  delay: number;
  /** Negative = hit to scheme efficiency / GDV (fraction, e.g. -0.15 = -15%). */
  density: number;
};

export type LenderScenarios = {
  base: LenderScenario;
  downside: LenderScenario;
  stressed: LenderScenario;
};

export const LENDER_SCENARIO_NOTE =
  "Downside reflects planning delays and reduced scheme efficiency. Stressed adds further delay and downside for a tail risk view.";

function roundIrr(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Planning friction inputs aligned with lender-grade scenario spec (may differ from mechanical GDV step in planningEffectModel). */
function planningFrictionForLender(riskLevel: "HIGH" | "MEDIUM" | "LOW"): {
  delay: number;
  densityHit: number;
} {
  if (riskLevel === "HIGH") return { delay: 6, densityHit: 0.15 };
  if (riskLevel === "MEDIUM") return { delay: 3, densityHit: 0.08 };
  return { delay: 0, densityHit: 0 };
}

/**
 * Build three IRR / delay / density rows from underwriting base IRR.
 * - Base: underwriting case, no planning overlay.
 * - Downside: delay drag at 0.15 pp/month; GDV hit from density.
 * - Stressed: heavier delay coefficient (0.25 pp/month), fixed −1.5 pp, extra 3 months, deeper density hit.
 */
export function buildLenderScenarios(
  baseIrr: number,
  riskLevel: "HIGH" | "MEDIUM" | "LOW",
): LenderScenarios {
  const { delay, densityHit } = planningFrictionForLender(riskLevel);

  const base: LenderScenario = {
    irr: roundIrr(baseIrr),
    delay: 0,
    density: 0,
  };

  const downside: LenderScenario = {
    irr: roundIrr(baseIrr - delay * 0.15),
    delay,
    density: -densityHit,
  };

  const stressed: LenderScenario = {
    irr: roundIrr(baseIrr - delay * 0.25 - 1.5),
    delay: delay + 3,
    density: -(densityHit + 0.05),
  };

  return { base, downside, stressed };
}
