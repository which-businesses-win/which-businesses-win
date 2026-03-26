import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import type { DealRow } from "@/lib/portfolio/aggregate";
import { enrichAllSourced, type SourcedRow } from "@/lib/sourcing/enrich";
import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ranked sourcing feed — live signals + portfolio fit.
 */
export async function GET(request: Request) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const [sourced, book, sectors] = await Promise.all([
    prisma.sourcedDeal.findMany({ orderBy: { date: "desc" } }),
    prisma.deal.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        sector: true,
        gdv: true,
        baseIRR: true,
        stressedIRR: true,
      },
    }),
    recomputeSectorsFromDb(),
  ]);

  const portfolioRows: DealRow[] = book.map((d) => ({
    id: d.id,
    name: d.name,
    location: d.location,
    sector: d.sector,
    gdv: d.gdv,
    baseIRR: d.baseIRR,
    stressedIRR: d.stressedIRR,
  }));

  const rows: SourcedRow[] = sourced.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    sector: r.sector,
    gdv: r.gdv,
    units: r.units,
    description: r.description,
    source: r.source,
    date: r.date,
    estimatedIRR: r.estimatedIRR,
  }));

  const opportunities = enrichAllSourced(rows, portfolioRows, sectors);

  return Response.json({
    count: opportunities.length,
    opportunities,
  });
}
