import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseIncoming(body: unknown): {
  name: string;
  location: string;
  sector: string;
  gdv: number;
  units?: number;
  description: string;
  source: string;
  date: Date;
  estimatedIRR: number;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const name = typeof o.name === "string" ? o.name.trim() : "";
  const location = typeof o.location === "string" ? o.location.trim() : "";
  const sector = typeof o.sector === "string" ? o.sector.trim() : "";
  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  const source = typeof o.source === "string" ? o.source.trim() : "";
  const dateRaw = typeof o.date === "string" ? o.date.trim() : "";

  const gdv =
    typeof o.gdv === "number" && Number.isFinite(o.gdv) && o.gdv > 0
      ? o.gdv
      : undefined;
  const units =
    typeof o.units === "number" && Number.isFinite(o.units) && o.units > 0
      ? Math.round(o.units)
      : undefined;
  const estimatedIRR =
    typeof o.estimatedIRR === "number" && Number.isFinite(o.estimatedIRR)
      ? o.estimatedIRR
      : typeof o.baseIRR === "number" && Number.isFinite(o.baseIRR)
        ? o.baseIRR
        : 15;

  if (!name || !location || !sector || !description || !source || !dateRaw) {
    return null;
  }
  if (gdv === undefined) return null;

  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return null;

  return {
    name,
    location,
    sector,
    gdv,
    units,
    description,
    source,
    date,
    estimatedIRR,
  };
}

/**
 * Ingest a sourced opportunity (pipeline, agent feed, manual).
 * POST JSON: { name, location, sector, gdv, description, source, date, estimatedIRR?, units? }
 */
export async function POST(request: Request) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
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

  const parsed = parseIncoming(body);
  if (!parsed) {
    return Response.json(
      {
        error: "validation_error",
        message:
          "Require name, location, sector, gdv (>0), description, source, date (ISO), optional units, estimatedIRR (default 15)",
      },
      { status: 400 },
    );
  }

  const row = await prisma.sourcedDeal.create({
    data: {
      name: parsed.name,
      location: parsed.location,
      sector: parsed.sector,
      gdv: parsed.gdv,
      units: parsed.units ?? null,
      description: parsed.description,
      source: parsed.source,
      date: parsed.date,
      estimatedIRR: parsed.estimatedIRR,
    },
  });

  return Response.json(
    {
      id: row.id,
      name: row.name,
      location: row.location,
      sector: row.sector,
      gdv: row.gdv,
      units: row.units,
      description: row.description,
      source: row.source,
      date: row.date.toISOString(),
      estimatedIRR: row.estimatedIRR,
      createdAt: row.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
