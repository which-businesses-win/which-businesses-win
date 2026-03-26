import { renderToBuffer } from "@react-pdf/renderer";

import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { MemoPdfDocument } from "@/lib/deals/MemoPdfDocument";
import { buildDealMemoPayload } from "@/lib/deals/memoPayload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function safeFilenamePart(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s.slice(0, 56) || "memo";
}

/**
 * Branded PDF memo (PlanSureAI) — same data as JSON memo route.
 */
export async function GET(request: Request, context: RouteContext) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const { id } = await context.params;
  const payload = await buildDealMemoPayload(id);

  if (!payload) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(<MemoPdfDocument payload={payload} />);
  const filename = `PlanSureAI-Memo-${safeFilenamePart(payload.dealDisplayName)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
