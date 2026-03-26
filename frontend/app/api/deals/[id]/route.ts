import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { marketPayloadFromEngine } from "@/lib/deals/dealDetailResponse";
import { computeDealSensitivity } from "@/lib/deals/sensitivity";
import { findSectorForDeal } from "@/lib/deals/signalImpact";
import { applyMarketToDeal } from "@/lib/marketImpact";
import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET — deal facts + single `market` object (IRR uplift, drivers, scores).
 * Optional auth when INTERNAL_API_SECRET / CRON_SECRET set.
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
      deal: {
        ...serializeDeal(deal),
        market: null,
      },
      matchError: "unknown_sector",
      message: `No matching sector for "${deal.sector}" — use slugs like build-to-rent, uk-housebuilders.`,
    });
  }

  const marketEngine = applyMarketToDeal(
    {
      baseIRR: deal.baseIRR,
      stressedIRR: deal.stressedIRR,
      location: deal.location,
    },
    sector,
  );
  const baseMarket = marketPayloadFromEngine(sector, marketEngine);
  const sens = computeDealSensitivity(deal.baseIRR, sector);
  const baseScenario = sens.scenarios.find((x) => x.name === "Base Case");
  const baseIrr = baseScenario?.irr ?? sens.bullIRR;
  const market = {
    ...baseMarket,
    scenarios: {
      bull: sens.bullIRR,
      base: baseIrr,
      bear: sens.bearIRR,
    },
    riskNote: sens.highVolatility
      ? "Moderate sensitivity to market conditions"
      : null,
  };

  return Response.json({
    deal: {
      ...serializeDeal(deal),
      market,
    },
    matchError: null,
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
