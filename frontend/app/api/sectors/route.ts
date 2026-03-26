import { listSectors } from "@/lib/sectors/service";
import type { SectorsListResponse } from "@/lib/sectors/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/sectors — full sector rows, sorted by score (desc) server-side.
 */
export async function GET() {
  const sectors = await listSectors();
  const body: SectorsListResponse = { sectors };
  return Response.json(body);
}
