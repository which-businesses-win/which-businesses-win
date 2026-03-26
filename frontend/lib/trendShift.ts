export type TrendShift = {
  type: "negative_shift" | "positive_shift";
  message: string;
};

type SignalLike = {
  reasons: string[];
  type?: string;
  decisionType?: string;
};

/** Second-order signal: directional balance of planning refusal vs approval in this run. */
export function detectTrendShift(signals: SignalLike[]): TrendShift | null {
  const planningRefusals = signals.filter(
    (s) =>
      s.type === "planning" &&
      (s.decisionType === "refusal" ||
        s.reasons.some((r) => /refusal/i.test(r))),
  );

  const planningApprovals = signals.filter(
    (s) =>
      s.type === "planning" &&
      (s.decisionType === "approval" ||
        s.reasons.some((r) => /approval|granted|approv/i.test(r))),
  );

  if (planningRefusals.length > planningApprovals.length + 2) {
    return {
      type: "negative_shift",
      message: "Nearby planning refusals outpacing approvals in this run",
    };
  }

  if (planningApprovals.length > planningRefusals.length + 2) {
    return {
      type: "positive_shift",
      message: "Local approvals outpacing refusals in this run",
    };
  }

  return null;
}
