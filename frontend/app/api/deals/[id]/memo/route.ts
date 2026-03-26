import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { buildDealMemoPayload } from "@/lib/deals/memoPayload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Structured investment memo — assembled from deal, live signals, scenarios, portfolio.
 * GET — same optional internal auth as `/api/deals/[id]`.
 */
export async function GET(request: Request, context: RouteContext) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const { id } = await context.params;
  const full = await buildDealMemoPayload(id);

  if (!full) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { memo, matchError, alert } = full;

  return Response.json({
    memo: {
      title: memo.title,
      summary: memo.summary,
      sections: memo.sections,
    },
    matchError,
    alert,
  });
}
