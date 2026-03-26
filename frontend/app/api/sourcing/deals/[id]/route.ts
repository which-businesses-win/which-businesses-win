import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { findSectorForDeal } from "@/lib/deals/signalImpact";
import type { DealRow } from "@/lib/portfolio/aggregate";
import {
  buildOpportunityDetail,
  enrichSourcedDeal,
  getPortfolioContext,
  type SourcedRow,
} from "@/lib/sourcing/enrich";
import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Single opportunity: enriched scores + “why” + flags.
 */
export async function GET(request: Request, context: RouteContext) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const { id } = await context.params;

  const row = await prisma.sourcedDeal.findUnique({ where: { id } });
  if (!row) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const [book, sectors] = await Promise.all([
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

  const sourced: SourcedRow = {
    id: row.id,
    name: row.name,
    location: row.location,
    sector: row.sector,
    gdv: row.gdv,
    units: row.units,
    description: row.description,
    source: row.source,
    date: row.date,
    estimatedIRR: row.estimatedIRR,
  };

  const sector = findSectorForDeal(row.sector, sectors);
  if (!sector) {
    return Response.json({
      error: "unknown_sector",
      message: `No sector match for "${row.sector}" — use slugs like btr, build-to-rent, uk-housebuilders.`,
    });
  }

  const ctx = getPortfolioContext(portfolioRows, sectors);
  const enriched = enrichSourcedDeal(
    sourced,
    sectors,
    ctx.exposure,
    ctx.marketVolatility01,
  );
  if (!enriched) {
    return Response.json({ error: "enrich_failed" }, { status: 500 });
  }

  const detail = buildOpportunityDetail(
    enriched,
    sector,
    portfolioRows,
    sectors,
  );

  return Response.json({
    ...detail,
    description: row.description,
    source: row.source,
  });
}
