import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { applySignalsPipeline } from "@/lib/signals/applyPipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Recompute sector scores from `RawSignal` rows and persist today’s `MarketSectorSnapshot` + `GeoScoreSnapshot`.
 * Intended for cron (GET) or manual runs (POST). Same auth as other internal routes.
 */
async function handle(request: Request) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const { sectorCount, bucketDate } = await applySignalsPipeline();

  return Response.json({
    ok: true,
    sectorCount,
    bucketDate,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
