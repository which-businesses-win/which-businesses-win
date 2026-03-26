import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { buildPortfolioPayload } from "@/lib/portfolio/aggregate";
import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Aggregate all stored deals into a signal-aware portfolio view.
 */
export async function GET(request: Request) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      location: true,
      sector: true,
      gdv: true,
      baseIRR: true,
      stressedIRR: true,
    },
  });

  const sectors = await recomputeSectorsFromDb();
  const payload = buildPortfolioPayload(deals, sectors);

  return Response.json(payload);
}
