import { prisma } from "@/lib/prisma";

export type MoatDashboardMetrics = {
  /** % correct among deals with an outcome (correct + incorrect only). */
  accuracy: number | null;
  /** Same, subset planningRisk === HIGH. */
  highRiskAccuracy: number | null;
  /** Among PROCEED deals with an outcome: % where result === approved. */
  proceedSuccessRate: number | null;
  counts: {
    dealsTotal: number;
    withOutcome: number;
    pending: number;
    correct: number;
    incorrect: number;
    /** HIGH risk + has outcome (any evaluation). */
    highRiskWithOutcome: number;
    highRiskCorrect: number;
    highRiskIncorrect: number;
    proceedWithOutcome: number;
    proceedApproved: number;
  };
};

function isPendingEval(e: string | null): boolean {
  return e == null || e === "pending";
}

export async function getMoatDashboardMetrics(): Promise<MoatDashboardMetrics> {
  const deals = await prisma.deal.findMany({
    include: { outcome: true },
  });

  const withOutcome = deals.filter((d) => d.outcome !== null);
  const decided = withOutcome.filter(
    (d) => d.evaluation === "correct" || d.evaluation === "incorrect",
  );
  const correct = decided.filter((d) => d.evaluation === "correct").length;
  const incorrect = decided.filter((d) => d.evaluation === "incorrect").length;
  const scored = correct + incorrect;
  const accuracy = scored > 0 ? Math.round((correct / scored) * 1000) / 10 : null;

  const highRiskDecided = decided.filter((d) => d.planningRisk === "HIGH");
  const highRiskCorrect = highRiskDecided.filter(
    (d) => d.evaluation === "correct",
  ).length;
  const highRiskIncorrect = highRiskDecided.filter(
    (d) => d.evaluation === "incorrect",
  ).length;
  const highRiskScored = highRiskCorrect + highRiskIncorrect;
  const highRiskAccuracy =
    highRiskScored > 0
      ? Math.round((highRiskCorrect / highRiskScored) * 1000) / 10
      : null;

  const proceedWithOutcome = deals.filter(
    (d) => d.decision === "PROCEED" && d.outcome !== null,
  );
  const proceedApproved = proceedWithOutcome.filter(
    (d) => d.outcome!.result === "approved",
  ).length;
  const proceedSuccessRate =
    proceedWithOutcome.length > 0
      ? Math.round((proceedApproved / proceedWithOutcome.length) * 1000) / 10
      : null;

  const highRiskWithOutcomeCount = deals.filter(
    (d) => d.planningRisk === "HIGH" && d.outcome !== null,
  ).length;

  return {
    accuracy,
    highRiskAccuracy,
    proceedSuccessRate,
    counts: {
      dealsTotal: deals.length,
      withOutcome: withOutcome.length,
      pending: deals.filter((d) => isPendingEval(d.evaluation)).length,
      correct,
      incorrect,
      highRiskWithOutcome: highRiskWithOutcomeCount,
      highRiskCorrect,
      highRiskIncorrect,
      proceedWithOutcome: proceedWithOutcome.length,
      proceedApproved,
    },
  };
}
