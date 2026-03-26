import { getSectorBySlug } from "@/lib/sectors/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/sectors/:slug — single sector (panel / detail).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const sector = await getSectorBySlug(decodeURIComponent(slug));
  if (!sector) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(sector);
}
