import { getIngestSignals } from "@/lib/ingest";
import { generateInsight } from "@/lib/insights";
import { calculateImpact } from "@/lib/impact";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const targetLocation = searchParams.get("location")?.toLowerCase() ?? undefined;
  const targetSector = searchParams.get("sector")?.toLowerCase() ?? undefined;

  const data = await getIngestSignals({
    targetLocation: targetLocation || null,
    targetSector: targetSector || null,
  });

  const insights = generateInsight(data.insightSignals, data.trends);
  const impact = calculateImpact(data.signals.slice(0, 10));

  return Response.json({
    signals: data.signals,
    trends: data.trends,
    insights,
    impact,
    changes: data.changes,
  });
}
