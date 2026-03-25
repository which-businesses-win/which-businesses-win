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
      message:
        "Planning activity elevated — increased approval/refusal volatility",
      action: "Review density and fallback strategies",
    });
  }

  if (retailSignals.length > 2) {
    insights.push({
      type: "warning",
      message: "Retail stress signals rising",
      action: "Re-evaluate tenant demand assumptions",
    });
  }

  const topTrend = trends[0];
  if (topTrend && topTrend.count > 5) {
    const where = topTrend.location ?? "the market (no location tag)";
    insights.push({
      type: "opportunity",
      message: `${topTrend.type} activity increasing in ${where}`,
      action: "Investigate local comparables and pipeline",
    });
  }

  return insights;
}
