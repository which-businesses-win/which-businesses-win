export type DecisionType = "unknown" | "refusal" | "approval" | "appeal";

export type PlanningCluster = {
  location: string;
  count: number;
  message: string;
};

export type PlanningPressure = {
  type: "negative" | "positive";
  message: string;
};

/** Headline-only inference for RSS items (pressure / analytics). */
export function inferRssDecisionType(title: string): DecisionType | undefined {
  const t = title.toLowerCase();
  if (/\brefus(ed|al|e|ing)?\b/.test(t) || t.includes("turned down")) {
    return "refusal";
  }
  if (
    t.includes("approved") ||
    t.includes("granted") ||
    t.includes("permission granted")
  ) {
    return "approval";
  }
  if (/\bappeal\b/.test(t)) {
    return "appeal";
  }
  return undefined;
}

export function detectClusters(
  signals: { location?: string | null }[],
): PlanningCluster[] {
  const map: Record<string, number> = {};

  for (const s of signals) {
    const loc = s.location?.trim().toLowerCase();
    if (!loc) continue;
    map[loc] = (map[loc] ?? 0) + 1;
  }

  const clusters: PlanningCluster[] = [];

  for (const location of Object.keys(map)) {
    const count = map[location];
    if (count >= 3) {
      const label =
        location.length > 0
          ? location.charAt(0).toUpperCase() + location.slice(1)
          : location;
      clusters.push({
        location,
        count,
        message: `High planning activity in ${label}`,
      });
    }
  }

  return clusters.sort((a, b) => b.count - a.count);
}

export function detectPlanningPressure(
  signals: { decisionType?: DecisionType }[],
): PlanningPressure | null {
  let refusals = 0;
  let approvals = 0;

  for (const s of signals) {
    if (s.decisionType === "refusal") refusals++;
    if (s.decisionType === "approval") approvals++;
  }

  if (refusals > approvals + 2) {
    return {
      type: "negative",
      message: "Planning resistance increasing",
    };
  }

  if (approvals > refusals + 2) {
    return {
      type: "positive",
      message: "Planning approvals gaining momentum",
    };
  }

  return null;
}
