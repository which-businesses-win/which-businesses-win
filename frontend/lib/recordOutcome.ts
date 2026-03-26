import { prisma } from "@/lib/prisma";

export type RecordOutcomeInput = {
  dealId: string;
  result: string;
  actualIRR: number | null;
  notes: string | null;
};

/**
 * Append-only: one outcome per deal. Sets Deal.evaluation per PlanSure rules.
 */
export async function recordOutcome(input: RecordOutcomeInput) {
  const existing = await prisma.outcome.findUnique({
    where: { dealId: input.dealId },
  });
  if (existing) {
    return { ok: false as const, status: 409 as const, message: "Outcome already recorded" };
  }

  const deal = await prisma.deal.findUnique({ where: { id: input.dealId } });
  if (!deal) {
    return { ok: false as const, status: 404 as const, message: "Deal not found" };
  }

  const result = input.result.trim().toLowerCase();

  let evaluation = "incorrect";
  if (deal.decision === "REJECT" && result === "refused") {
    evaluation = "correct";
  }
  if (deal.decision === "PROCEED" && result === "approved") {
    evaluation = "correct";
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const o = await tx.outcome.create({
      data: {
        dealId: input.dealId,
        result,
        actualIRR: input.actualIRR,
        notes: input.notes,
      },
    });
    await tx.deal.update({
      where: { id: deal.id },
      data: { evaluation },
    });
    return o;
  });

  return { ok: true as const, outcome, evaluation };
}
