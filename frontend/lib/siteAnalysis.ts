import type { DecisionType } from "@/lib/planningIntel";

export type SiteMetrics = {
  total: number;
  refusals: number;
  approvals: number;
  refusalRate: number;
  riskScore: number;
};

export type SiteInsight = {
  level: string;
  message: string;
  action: string;
};

export function calculateSiteMetrics(
  signals: { decisionType?: DecisionType }[],
): SiteMetrics {
  let refusals = 0;
  let approvals = 0;

  for (const s of signals) {
    if (s.decisionType === "refusal") refusals++;
    if (s.decisionType === "approval") approvals++;
  }

  const total = signals.length;
  const refusalRate = total > 0 ? refusals / total : 0;

  let riskScore = 0;
  if (refusalRate > 0.6) riskScore = 80;
  else if (refusalRate > 0.4) riskScore = 60;
  else if (refusalRate > 0.2) riskScore = 40;
  else riskScore = 20;

  return {
    total,
    refusals,
    approvals,
    refusalRate,
    riskScore,
  };
}

export function generateSiteInsight(metrics: SiteMetrics): SiteInsight {
  if (metrics.total === 0) {
    return {
      level: "NO NEARBY ACTIVITY",
      message: "No qualifying planning signals within the analysis radius this run.",
      action: "Widen the site description or check again after the next ingest.",
    };
  }

  if (metrics.riskScore >= 70) {
    return {
      level: "HIGH RISK",
      message: "Nearby planning refusals are dominant — expect resistance on similar schemes",
      action: "Cut density, strengthen design rationale, or plan for appeal time and cost",
    };
  }

  if (metrics.riskScore >= 50) {
    return {
      level: "MODERATE RISK",
      message: "Mixed planning outcomes nearby — committees are sending mixed signals",
      action: "Proceed with a tight narrative and local evidence, not generic optimism",
    };
  }

  return {
    level: "LOW RISK",
    message: "Local planning environment looks workable for similar uses",
    action: "Still justify the scheme — low risk is not no risk",
  };
}
