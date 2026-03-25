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
        "Planning refusal signals increasing in target area — elevated volatility",
      action:
        "Expect resistance — consider density reduction or fallback scheme",
    });
  }

  if (retailSignals.length > 2) {
    insights.push({
      type: "warning",
      message: "Retail distress signals clustering — tenant demand risk",
      action: "Stress-test income and covenant assumptions on retail exposure",
    });
  }

  const topTrend = trends[0];
  if (topTrend && topTrend.count > 5) {
    const where = topTrend.location ?? "the market (no location tag)";
    insights.push({
      type: "opportunity",
      message: `Approval comps emerging locally — ${topTrend.type} activity building in ${where}`,
      action: "Supports planning case — review comparables for uplift",
    });
  }

  return insights;
}
