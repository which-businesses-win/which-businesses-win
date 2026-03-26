import { unauthorizedIfInternalSecretMismatch } from "@/lib/internalApiAuth";
import { recordOutcome } from "@/lib/recordOutcome";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESULTS = new Set(["approved", "refused", "delayed"]);

function parseOutcomeBody(body: unknown): {
  result: string;
  actualIRR: number | null;
  notes: string | null;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const resultRaw =
    typeof o.result === "string" ? o.result.trim().toLowerCase() : "";
  if (!RESULTS.has(resultRaw)) return null;

  const rawAir = o.actualIRR ?? o.actualIrr;
  let actualIRR: number | null = null;
  if (rawAir !== undefined && rawAir !== null) {
    if (typeof rawAir !== "number" || !Number.isFinite(rawAir)) {
      return null;
    }
    actualIRR = rawAir;
  }

  const notes =
    typeof o.notes === "string" ? o.notes.trim() || null : null;

  return { result: resultRaw, actualIRR, notes };
}

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Record one outcome per deal (append-only). Prefer POST /api/outcome for manual logging.
 */
export async function POST(request: Request, context: RouteContext) {
  const denied = unauthorizedIfInternalSecretMismatch(request);
  if (denied) return denied;

  const { id: dealId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json", message: "Expected JSON body" },
      { status: 400 },
    );
  }

  const parsed = parseOutcomeBody(body);
  if (!parsed) {
    return Response.json(
      {
        error: "validation_error",
        message:
          "Require result (approved | refused | delayed); optional actualIRR, notes",
      },
      { status: 400 },
    );
  }

  const res = await recordOutcome({
    dealId,
    result: parsed.result,
    actualIRR: parsed.actualIRR,
    notes: parsed.notes,
  });

  if (!res.ok) {
    return Response.json(
      { error: res.status === 404 ? "not_found" : "conflict", message: res.message },
      { status: res.status },
    );
  }

  return Response.json(
    {
      id: res.outcome.id,
      dealId: res.outcome.dealId,
      result: res.outcome.result,
      actualIRR: res.outcome.actualIRR,
      notes: res.outcome.notes,
      recordedAt: res.outcome.recordedAt.toISOString(),
      evaluation: res.evaluation,
    },
    { status: 201 },
  );
}
