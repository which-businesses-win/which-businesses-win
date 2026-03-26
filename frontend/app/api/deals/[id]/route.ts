import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { dealSignalAlert, findSectorForDeal } from "@/lib/deals/signalImpact";
import {
  applyMarketToDeal,
  marketAwareRecommendation,
  marketImpactHeadline,
} from "@/lib/marketImpact";
import { computeDealSensitivity } from "@/lib/deals/sensitivity";
import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Live deal + market signal bridge: sector/geo scores → IRR adjustment.
 * GET — optional auth when INTERNAL_API_SECRET / CRON_SECRET set (same as other internal reads).
 */
export async function GET(request: Request, context: RouteContext) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const { id } = await context.params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { snapshot: true },
  });

  if (!deal) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const sectors = await recomputeSectorsFromDb();
  const sector = findSectorForDeal(deal.sector, sectors);

  if (!sector) {
    return Response.json({
      deal: serializeDeal(deal),
      signalImpact: null,
      adjustedIRR: deal.baseIRR,
      adjustedStressedIRR: deal.stressedIRR,
      alert: null,
      sensitivity: null,
      matchError: "unknown_sector",
      message: `No matching sector for "${deal.sector}" — use slugs like build-to-rent, uk-housebuilders.`,
      marketImpact: null,
      marketRecommendation: null,
    });
  }

  const market = applyMarketToDeal(
    {
      baseIRR: deal.baseIRR,
      stressedIRR: deal.stressedIRR,
      location: deal.location,
    },
    sector,
  );
  const signalImpact = market.signal;
  const adjustedIRR = market.adjustedIRR;
  const adjustedStressedIRR = market.adjustedStressedIRR;
  const alert = dealSignalAlert(signalImpact.irrAdjustment);
  const sensitivity = computeDealSensitivity(deal.baseIRR, sector);
  const sectorDisplayName = sector.displayTitle ?? sector.name;

  return Response.json({
    deal: serializeDeal(deal),
    signalImpact,
    adjustedIRR,
    adjustedStressedIRR,
    alert,
    sensitivity,
    matchError: null,
    marketImpact: {
      adjustedIRR: market.adjustedIRR,
      irrAdjustment: market.irrAdjustment,
      sectorScore: market.sectorScore,
      geoScore: market.geoScore,
      impactScore: market.impactScore,
      sectorLabel: market.sectorLabel,
      geoLabel: market.geoLabel,
      sectorShort: market.sectorShort,
      cityLabel: market.cityLabel,
      headline: marketImpactHeadline(market, sectorDisplayName),
    },
    marketRecommendation: marketAwareRecommendation(
      deal.decision,
      market.irrAdjustment,
      market.sectorShort,
      market.cityLabel,
    ),
  });
}

function serializeDeal(
  deal: {
    id: string;
    name: string | null;
    gdv: number;
    location: string;
    sector: string;
    baseIRR: number;
    stressedIRR: number;
    planningRisk: string;
    decision: string;
    evaluation: string | null;
    createdAt: Date;
    snapshot: {
      refusalRate: number;
      nearbyCount: number;
      drivers: string;
    } | null;
  },
) {
  return {
    id: deal.id,
    name: deal.name ?? deal.location,
    gdv: deal.gdv,
    location: deal.location,
    sector: deal.sector,
    baseIRR: deal.baseIRR,
    stressedIRR: deal.stressedIRR,
    planningRisk: deal.planningRisk,
    decision: deal.decision,
    evaluation: deal.evaluation,
    createdAt: deal.createdAt.toISOString(),
    snapshot: deal.snapshot
      ? {
          refusalRate: deal.snapshot.refusalRate,
          nearbyCount: deal.snapshot.nearbyCount,
        }
      : null,
  };
}
