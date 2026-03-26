import {
  unauthorizedIfCronOrInternalMismatch,
  unauthorizedIfInternalSecretMismatch,
} from "@/lib/internalApiAuth";
import {
  driversToStored,
  isDecisionVerdict,
  isPlanningRisk,
  normalizeDecision,
  normalizePlanningRisk,
  parseSignalSnapshot,
  type SignalSnapshotInput,
} from "@/lib/moatValidation";
import { findSectorForDeal } from "@/lib/deals/signalImpact";
import { marketPayloadFromEngine } from "@/lib/deals/dealDetailResponse";
import { applyMarketToDeal, marketAwareRecommendation } from "@/lib/marketImpact";
import { prisma } from "@/lib/prisma";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/deals — book deals with live market-adjusted IRR.
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
      baseIRR: true,
      stressedIRR: true,
    },
  });

  const sectors = await recomputeSectorsFromDb();

  const summaries = deals.map((d) => {
    const sector = findSectorForDeal(d.sector, sectors);
    if (!sector) {
      return {
        id: d.id,
        name: d.name ?? d.location,
        location: d.location,
        sector: d.sector,
        baseIRR: d.baseIRR,
        market: null,
      };
    }
    const engine = applyMarketToDeal(
      {
        baseIRR: d.baseIRR,
        stressedIRR: d.stressedIRR,
        location: d.location,
      },
      sector,
    );
    return {
      id: d.id,
      name: d.name ?? d.location,
      location: d.location,
      sector: d.sector,
      baseIRR: d.baseIRR,
      market: marketPayloadFromEngine(sector, engine),
    };
  });

  return Response.json({ deals: summaries });
}

function num(o: Record<string, unknown>, a: string, b: string): number | undefined {
  const v = o[a] ?? o[b];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function parseDealBody(body: unknown): {
  name?: string;
  gdv?: number;
  location: string;
  sector: string;
  baseIRR: number;
  stressedIRR: number;
  planningRisk: string;
  decision: string;
  snapshot: SignalSnapshotInput;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const baseIRR = num(o, "baseIRR", "baseIrr");
  const stressedIRR = num(o, "stressedIRR", "stressedIrr");
  if (baseIRR === undefined || stressedIRR === undefined) return null;

  const planningRiskRaw =
    typeof o.planningRisk === "string" ? o.planningRisk.trim() : "";
  const pr = normalizePlanningRisk(planningRiskRaw);
  if (!planningRiskRaw || !isPlanningRisk(pr)) return null;

  const decisionRaw =
    typeof o.decision === "string" ? o.decision.trim() : "";
  const dv = normalizeDecision(decisionRaw);
  if (!decisionRaw || !isDecisionVerdict(dv)) return null;

  const nameRaw = typeof o.name === "string" ? o.name.trim() : "";
  const gdvRaw = num(o, "gdv", "GDV");
  const gdv =
    gdvRaw !== undefined && gdvRaw > 0 ? gdvRaw : undefined;

  const location =
    typeof o.location === "string" ? o.location.trim() : "";
  const sector = typeof o.sector === "string" ? o.sector.trim() : "";

  const snapRaw = o.snapshot ?? o.signalSnapshot;
  const snap = parseSignalSnapshot(snapRaw);
  if (!snap) return null;

  return {
    ...(nameRaw ? { name: nameRaw } : {}),
    ...(gdv !== undefined ? { gdv } : {}),
    location,
    sector,
    baseIRR,
    stressedIRR,
    planningRisk: pr,
    decision: dv,
    snapshot: snap,
  };
}

/**
 * Record a deal + signal snapshot (longitudinal spine).
 * POST JSON: { location, sector, baseIRR, stressedIRR, planningRisk, decision, snapshot }
 * snapshot: { refusalRate, nearbyCount, drivers: string[] }
 */
export async function POST(request: Request) {
  const denied = unauthorizedIfInternalSecretMismatch(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json", message: "Expected JSON body" },
      { status: 400 },
    );
  }

  const parsed = parseDealBody(body);
  if (!parsed) {
    return Response.json(
      {
        error: "validation_error",
        message:
          "Require baseIRR, stressedIRR, planningRisk (LOW|MEDIUM|HIGH), decision (PROCEED|CAUTION|REJECT), snapshot: { refusalRate, nearbyCount, drivers[] }",
      },
      { status: 400 },
    );
  }

  const deal = await prisma.deal.create({
    data: {
      ...(parsed.name ? { name: parsed.name } : {}),
      ...(parsed.gdv !== undefined ? { gdv: parsed.gdv } : {}),
      location: parsed.location,
      sector: parsed.sector,
      baseIRR: parsed.baseIRR,
      stressedIRR: parsed.stressedIRR,
      planningRisk: parsed.planningRisk,
      decision: parsed.decision,
      snapshot: {
        create: {
          refusalRate: parsed.snapshot.refusalRate,
          nearbyCount: parsed.snapshot.nearbyCount,
          drivers: driversToStored(parsed.snapshot.drivers),
        },
      },
    },
    include: { snapshot: true },
  });

  const sectors = await recomputeSectorsFromDb();
  const sector = findSectorForDeal(deal.sector, sectors);
  const marketPayload =
    sector &&
    (() => {
      const engine = applyMarketToDeal(
        {
          baseIRR: deal.baseIRR,
          stressedIRR: deal.stressedIRR,
          location: deal.location,
        },
        sector,
      );
      return {
        market: marketPayloadFromEngine(sector, engine),
        marketRecommendation: marketAwareRecommendation(
          deal.decision,
          engine.irrAdjustment,
          engine.sectorShort,
          engine.cityLabel,
        ),
      };
    })();

  return Response.json(
    {
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
            drivers: parsed.snapshot.drivers,
          }
        : null,
      ...(marketPayload ?? {
        market: null,
        marketRecommendation: null,
      }),
    },
    { status: 201 },
  );
}
