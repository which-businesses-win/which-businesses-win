import { unauthorizedIfInternalSecretMismatch } from "@/lib/internalApiAuth";
import { driversToStored } from "@/lib/moatValidation";
import { getPlanningIntelligencePayload } from "@/lib/planningIntelligencePayload";
import {
  toPlanningIntelligenceService,
  type PlanningIntelligenceService,
} from "@/lib/planningIntelligenceService";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = (): HeadersInit => {
  const origin = process.env.PLANNING_INTELLIGENCE_CORS_ORIGIN?.trim();
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Internal-Key",
  };
};

/**
 * PlanSureAI — planning intelligence service (structured, UK-grounded effects).
 * POST { "location": string?, "sector": string?, "baseIrr": number?, "recordDeal"?: boolean }
 * When `recordDeal` is true and scenarios exist, persists Deal + snapshot and returns `dealId`.
 * When `baseIrr` is provided, `scenarios` and `decision` (Proceed / Caution / Reject) are included.
 */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const denied = unauthorizedIfInternalSecretMismatch(request);
  if (denied) return denied;

  let body: {
    location?: unknown;
    sector?: unknown;
    baseIrr?: unknown;
    recordDeal?: unknown;
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const locationRaw =
    typeof body.location === "string" ? body.location.trim().toLowerCase() : "";
  const sectorRaw =
    typeof body.sector === "string" ? body.sector.trim().toLowerCase() : "";
  const location = locationRaw || "";
  const sector = sectorRaw || "";

  const baseIrr =
    typeof body.baseIrr === "number" && Number.isFinite(body.baseIrr)
      ? body.baseIrr
      : undefined;

  const payload = await getPlanningIntelligencePayload({
    targetLocation: locationRaw || null,
    targetSector: sectorRaw && sectorRaw !== "general" ? sectorRaw : null,
  });

  const service: PlanningIntelligenceService = toPlanningIntelligenceService(payload, {
    baseIrr,
  });

  const recordDeal = body.recordDeal === true;
  let dealId: string | undefined;

  if (
    recordDeal &&
    service.decision &&
    service.scenarios &&
    typeof baseIrr === "number" &&
    Number.isFinite(baseIrr)
  ) {
    const created = await prisma.deal.create({
      data: {
        location,
        sector,
        baseIRR: baseIrr,
        stressedIRR: service.scenarios.stressed.irr,
        planningRisk: service.decision.planningRisk,
        decision: service.decision.decision,
        snapshot: {
          create: {
            refusalRate: service.refusalRate,
            nearbyCount: service.nearbyCount,
            drivers: driversToStored(service.drivers),
          },
        },
      },
    });
    dealId = created.id;
  }

  return Response.json(
    dealId ? { ...service, dealId } : service,
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    },
  );
}
