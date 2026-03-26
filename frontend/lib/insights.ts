import type { IngestSignal, TrendRow } from "@/lib/ingest";

export type Insight = {
  type: "risk" | "warning" | "opportunity";
  message: string;
  action: string;
};

export function generateInsight(
  signals: IngestSignal[],
  trends: TrendRow[],
): Insight[] {
  const insights: Insight[] = [];

  const planningSignals = signals.filter((s) => s.type === "planning");
  const retailSignals = signals.filter((s) => s.type === "retail");

  if (planningSignals.length > 3) {
    insights.push({
      type: "risk",
      message: "Nearby planning refusals increasing — expect tougher committee outcomes",
      action: "Reduce density or line up a credible fallback scheme",
    });
  }

  if (retailSignals.length > 2) {
    insights.push({
      type: "warning",
      message: "Retail demand weakening locally — tenant risk is building",
      action: "Stress-test rent and covenant before you rely on retail income",
    });
  }

  const topTrend = trends[0];
  if (topTrend && topTrend.count > 5) {
    const where = topTrend.location ?? "this market";
    insights.push({
      type: "opportunity",
      message: `Local momentum — ${topTrend.type} activity is building in ${where}`,
      action: "Use comparables to support value and planning narrative",
    });
  }

  return insights;
}
