import { getIngestSignals } from "@/lib/ingest";
import { generateInsight } from "@/lib/insights";
import { calculateImpact } from "@/lib/impact";

/** Shared JSON payload for Deal Intelligence — used by /api/ingest (demo) and /api/internal/planning-intelligence (PlanSureAI). */
export async function getPlanningIntelligencePayload(options: {
  targetLocation: string | null;
  targetSector: string | null;
}) {
  const data = await getIngestSignals({
    targetLocation: options.targetLocation,
    targetSector: options.targetSector,
  });

  const insights = generateInsight(data.insightSignals, data.trends);
  const impact = calculateImpact(data.signals.slice(0, 10));

  return {
    signals: data.signals,
    trends: data.trends,
    insights,
    impact,
    changes: data.changes,
    trendShift: data.trendShift,
    clusters: data.clusters,
    pressure: data.pressure,
    nearbySignals: data.nearbySignals,
    siteMetrics: data.siteMetrics,
    siteInsight: data.siteInsight,
    siteCoords: data.siteCoords,
  };
}
