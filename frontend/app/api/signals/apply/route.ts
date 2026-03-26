import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { applySignalsPipeline } from "@/lib/signals/applyPipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Recompute sector metrics from all `RawSignal` rows and persist snapshots.
 * Same engine as `/api/internal/signals/process` — use when signals exist but scores need a refresh.
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
