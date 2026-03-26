import { unauthorizedIfInternalSecretMismatch } from "@/lib/internalApiAuth";
import { getPlanningIntelligencePayload } from "@/lib/planningIntelligencePayload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PlanSureAI / server-to-server integration.
 * Same payload as GET /api/ingest (plus _meta).
 *
 * Requires INTERNAL_API_SECRET on the server and a matching Bearer or X-Internal-Key on the request.
 * Until configured, returns 503 — use /api/ingest for local demo.
 */
export async function GET(request: Request) {
  if (!process.env.INTERNAL_API_SECRET?.trim()) {
    return new Response(
      JSON.stringify({
        error: "not_configured",
        message:
          "Set INTERNAL_API_SECRET to enable this endpoint. Use GET /api/ingest for the demo UI.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const denied = unauthorizedIfInternalSecretMismatch(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const targetLocation = searchParams.get("location")?.toLowerCase() ?? undefined;
  const targetSector = searchParams.get("sector")?.toLowerCase() ?? undefined;

  const payload = await getPlanningIntelligencePayload({
    targetLocation: targetLocation || null,
    targetSector: targetSector || null,
  });

  return Response.json({
    ...payload,
    _meta: {
      source: "planning-intelligence",
      for: "PlanSureAI",
    },
  });
}
