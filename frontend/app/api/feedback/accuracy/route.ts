import { unauthorizedIfInternalSecretMismatch } from "@/lib/internalApiAuth";
import { getMoatDashboardMetrics } from "@/lib/moatMetrics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Aggregate metrics from stored Deal.evaluation (longitudinal spine).
 * Query: ?byDecision=1 — optional breakdown (uses same underlying counts).
 */
export async function GET(request: Request) {
  const denied = unauthorizedIfInternalSecretMismatch(request);
  if (denied) return denied;

  const byDecision =
    new URL(request.url).searchParams.get("byDecision") === "1";

  const metrics = await getMoatDashboardMetrics();

  if (!byDecision) {
    return Response.json(metrics);
  }

  const deals = await prisma.deal.findMany({ include: { outcome: true } });

  return Response.json({
    ...metrics,
    byDecision: {
      PROCEED: {
        withOutcome: deals.filter((d) => d.decision === "PROCEED" && d.outcome)
          .length,
        correct: deals.filter(
          (d) => d.decision === "PROCEED" && d.evaluation === "correct",
        ).length,
        incorrect: deals.filter(
          (d) => d.decision === "PROCEED" && d.evaluation === "incorrect",
        ).length,
      },
      CAUTION: {
        withOutcome: deals.filter((d) => d.decision === "CAUTION" && d.outcome)
          .length,
        correct: deals.filter(
          (d) => d.decision === "CAUTION" && d.evaluation === "correct",
        ).length,
        incorrect: deals.filter(
          (d) => d.decision === "CAUTION" && d.evaluation === "incorrect",
        ).length,
      },
      REJECT: {
        withOutcome: deals.filter((d) => d.decision === "REJECT" && d.outcome)
          .length,
        correct: deals.filter(
          (d) => d.decision === "REJECT" && d.evaluation === "correct",
        ).length,
        incorrect: deals.filter(
          (d) => d.decision === "REJECT" && d.evaluation === "incorrect",
        ).length,
      },
    },
  });
}
