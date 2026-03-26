import { unauthorizedIfInternalSecretMismatch } from "@/lib/internalApiAuth";
import { recordOutcome } from "@/lib/recordOutcome";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESULTS = new Set(["approved", "refused", "delayed"]);

/**
 * Manual outcome logging — POST JSON: { dealId, result, actualIRR?, notes? }
 */
export async function POST(request: Request) {
  const denied = unauthorizedIfInternalSecretMismatch(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "invalid_json", message: "Expected JSON body" },
      { status: 400 },
    );
  }

  const dealId =
    typeof body.dealId === "string" ? body.dealId.trim() : "";
  if (!dealId) {
    return Response.json(
      { error: "validation_error", message: "dealId required" },
      { status: 400 },
    );
  }

  const resultRaw =
    typeof body.result === "string" ? body.result.trim().toLowerCase() : "";
  if (!RESULTS.has(resultRaw)) {
    return Response.json(
      {
        error: "validation_error",
        message: "result must be approved | refused | delayed",
      },
      { status: 400 },
    );
  }

  const rawAir = body.actualIRR ?? body.actualIrr;
  let actualIRR: number | null = null;
  if (rawAir !== undefined && rawAir !== null) {
    if (typeof rawAir !== "number" || !Number.isFinite(rawAir)) {
      return Response.json(
        { error: "validation_error", message: "actualIRR must be a number" },
        { status: 400 },
      );
    }
    actualIRR = rawAir;
  }

  const notes =
    typeof body.notes === "string" ? body.notes.trim() || null : null;

  const res = await recordOutcome({
    dealId,
    result: resultRaw,
    actualIRR,
    notes,
  });

  if (!res.ok) {
    return Response.json(
      { error: res.status === 404 ? "not_found" : "conflict", message: res.message },
      { status: res.status },
    );
  }

  return Response.json({
    ...res.outcome,
    evaluation: res.evaluation,
  });
}
