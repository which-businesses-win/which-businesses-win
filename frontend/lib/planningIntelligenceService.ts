import { getPlanningDecision, type PlanningDecision } from "@/lib/decisionEngine";
import type { getPlanningIntelligencePayload } from "@/lib/planningIntelligencePayload";
import {
  buildLenderScenarios,
  LENDER_SCENARIO_NOTE,
  type LenderScenarios,
} from "@/lib/lenderScenarios";
import {
  DELAY_IRR_POINTS_PER_MONTH,
  effectDriverLines,
  effectsFromRiskLevel,
  irrDelayImpactPoints,
} from "@/lib/planningEffectModel";
import type { SiteInsight, SiteMetrics } from "@/lib/siteAnalysis";

export {
  LENDER_SCENARIO_NOTE,
  type LenderScenario,
  type LenderScenarios,
} from "@/lib/lenderScenarios";
export type { PlanningDecision, DecisionVerdict } from "@/lib/decisionEngine";

/** Slim contract for PlanSureAI — causal chain, not a black-box IRR. */
export type PlanningIntelligenceService = {
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  refusalRate: number;
  nearbyCount: number;
  drivers: string[];

  /** Months of indicative delay from planning friction. */
  delayMonths: number;
  /** Fractional GDV / scheme-size adjustment (e.g. -0.1 = -10%). */
  densityAdjustment: number;
  /** 0–1; use (1 - riskPenalty) on IRR after delay. */
  riskPenalty: number;
  /** Coefficient: IRR points lost per month of delay (default 0.15). */
  delayIrrPointsPerMonth: number;
  /**
   * IRR percentage points from delay only (negative when delay > 0).
   * `irrAfterDelay = baseIrr + irrDelayImpactPoints`
   */
  irrDelayImpactPoints: number;
  /**
   * Same as irrDelayImpactPoints — kept for backward compatibility with earlier integrations.
   * Prefer using irrDelayImpactPoints + riskPenalty explicitly in new code.
   */
  impact: number;

  /** Present when POST includes `baseIrr` — base / downside / stressed for credit-style review. */
  scenarios: LenderScenarios | null;
  /** Short copy for the deal UI under the scenario table. */
  lenderNote: string;

  /**
   * Proceed / Caution / Reject — present when `baseIrr` was sent (scenarios computed).
   * Otherwise null until the deal supplies a base IRR for stress testing.
   */
  decision: PlanningDecision | null;
};

type FullPayload = Awaited<ReturnType<typeof getPlanningIntelligencePayload>>;

function riskLevelFromInsight(
  siteInsight: SiteInsight | null,
  siteMetrics: SiteMetrics,
): PlanningIntelligenceService["riskLevel"] {
  if (siteInsight?.level === "SITE NOT LOCATED") return "MEDIUM";

  if (siteInsight) {
    if (siteInsight.level.includes("HIGH")) return "HIGH";
    if (siteInsight.level.includes("MODERATE")) return "MEDIUM";
    if (siteInsight.level.includes("LOW")) return "LOW";
    if (siteInsight.level.includes("NO NEARBY")) return "LOW";
  }

  if (siteMetrics.riskScore >= 70) return "HIGH";
  if (siteMetrics.riskScore >= 50) return "MEDIUM";
  return "LOW";
}

export type ToPlanningIntelligenceOptions = {
  /** Underwriting / model base IRR (%). When set, returns `scenarios` for Base / Downside / Stressed. */
  baseIrr?: number;
};

/** Map full ingest payload → PlanSureAI service shape. */
export function toPlanningIntelligenceService(
  payload: FullPayload,
  options?: ToPlanningIntelligenceOptions,
): PlanningIntelligenceService {
  const { siteMetrics, siteInsight, impact, nearbySignals } = payload;

  const riskLevel = riskLevelFromInsight(siteInsight, siteMetrics);
  const mechanical = effectsFromRiskLevel(riskLevel);
  const delayPts = irrDelayImpactPoints(mechanical.delayMonths);

  const signalDrivers = [...new Set(impact.drivers)];
  const effectLines = effectDriverLines(mechanical);
  const drivers = [...signalDrivers, ...effectLines];

  const baseIrr = options?.baseIrr;
  const scenarios =
    typeof baseIrr === "number" && Number.isFinite(baseIrr)
      ? buildLenderScenarios(baseIrr, riskLevel)
      : null;

  const decision = getPlanningDecision(scenarios, riskLevel);

  return {
    riskLevel,
    refusalRate: siteMetrics.refusalRate,
    nearbyCount: nearbySignals.length,
    drivers,
    delayMonths: mechanical.delayMonths,
    densityAdjustment: mechanical.densityAdjustment,
    riskPenalty: mechanical.riskPenalty,
    delayIrrPointsPerMonth: DELAY_IRR_POINTS_PER_MONTH,
    irrDelayImpactPoints: delayPts,
    impact: delayPts,
    scenarios,
    lenderNote: LENDER_SCENARIO_NOTE,
    decision,
  };
}
