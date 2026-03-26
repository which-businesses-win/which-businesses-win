import { getPlanningIntelligencePayload } from "@/lib/planningIntelligencePayload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Demo / lab — same engine as GET /api/internal/planning-intelligence. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const targetLocation = searchParams.get("location")?.toLowerCase() ?? undefined;
  const targetSector = searchParams.get("sector")?.toLowerCase() ?? undefined;

  const payload = await getPlanningIntelligencePayload({
    targetLocation: targetLocation || null,
    targetSector: targetSector || null,
  });

  return Response.json(payload);
}
