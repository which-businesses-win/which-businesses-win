/**
 * Compare model decision vs recorded outcome — stored on Deal.evaluation.
 */

export type DealEvaluationStatus = "pending" | "correct" | "incorrect";

export type DecisionVerdict = "PROCEED" | "CAUTION" | "REJECT";

export type OutcomeResult = "approved" | "refused" | "delayed";

export type DealForEvaluation = { decision: string };
export type OutcomeForEvaluation = { result: string };

export function evaluate(
  deal: DealForEvaluation,
  outcome: OutcomeForEvaluation | null | undefined,
): DealEvaluationStatus {
  if (!outcome) {
    return "pending";
  }

  const d = deal.decision.trim().toUpperCase();
  const r = outcome.result.trim().toLowerCase();

  if (d === "REJECT" && r === "refused") {
    return "correct";
  }

  if (d === "PROCEED" && r === "approved") {
    return "correct";
  }

  return "incorrect";
}
