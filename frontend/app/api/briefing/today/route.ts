import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { generateBriefing } from "@/lib/briefing/generateBriefing";
import type { DealRow } from "@/lib/portfolio/aggregate";
import { buildPortfolioPayload } from "@/lib/portfolio/aggregate";
import { prisma } from "@/lib/prisma";
import { enrichAllSourced, type SourcedRow } from "@/lib/sourcing/enrich";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-screen daily briefing: market shift, sector deltas, top opportunities, risks, actions, alerts.
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

  const portfolio = buildPortfolioPayload(portfolioRows, sectors);

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

  const briefing = generateBriefing({
    sectors,
    portfolio,
    opportunities,
    bookRows: book.map((d) => ({
      id: d.id,
      name: d.name,
      location: d.location,
      sector: d.sector,
    })),
  });

  return Response.json(briefing);
}
