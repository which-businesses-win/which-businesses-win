import type { LenderScenarios } from "@/lib/lenderScenarios";

export type DecisionVerdict = "PROCEED" | "CAUTION" | "REJECT";

export type PlanningRiskLevel = "HIGH" | "MEDIUM" | "LOW";

/** Single headline verdict — conservative, explainable in ~10 seconds. */
export type PlanningDecision = {
  /** PROCEED | CAUTION | REJECT — use `data.decision.decision` in PlanSureAI. */
  decision: DecisionVerdict;
  reason: string;
  /** Stressed IRR (%) when scenarios exist; null if base IRR was not provided. */
  stressedIrr: number | null;
  planningRisk: PlanningRiskLevel;
};

/**
 * Stressed IRR + planning risk → Proceed / Caution / Reject.
 * Slightly conservative by design (credit-committee friendly, not optimistic).
 *
 * Requires `scenarios` (i.e. POST must include `baseIrr`). Otherwise returns null — PlanSure should prompt for base IRR.
 */
export function getPlanningDecision(
  scenarios: LenderScenarios | null,
  riskLevel: PlanningRiskLevel,
): PlanningDecision | null {
  if (!scenarios) {
    return null;
  }

  const stressedIRR = scenarios.stressed.irr;
  const risk = riskLevel;

  if (stressedIRR < 12 || risk === "HIGH") {
    return {
      decision: "REJECT",
      reason: "Low resilience under planning risk",
      stressedIrr: stressedIRR,
      planningRisk: riskLevel,
    };
  }

  if (stressedIRR < 15 || risk === "MEDIUM") {
    return {
      decision: "CAUTION",
      reason: "Moderate risk — requires careful structuring",
      stressedIrr: stressedIRR,
      planningRisk: riskLevel,
    };
  }

  return {
    decision: "PROCEED",
    reason: "Strong resilience with manageable planning risk",
    stressedIrr: stressedIRR,
    planningRisk: riskLevel,
  };
}
