import { unauthorizedIfInternalSecretMismatch } from "@/lib/internalApiAuth";
import { prisma } from "@/lib/prisma";
import { normalizeLocationForStorage } from "@/lib/signals/locationNormalize";
import { normalizeSectorSlugs } from "@/lib/signals/normalize";
import { parseRawSignalIngest } from "@/lib/signals/ingestValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ingest a structured market signal (planning, capital, demand, etc.).
 * When INTERNAL_API_SECRET is set, requires Bearer or X-Internal-Key.
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

  const parsed = parseRawSignalIngest(body);
  if (!parsed) {
    return Response.json(
      {
        error: "validation_error",
        message:
          "Require title, source, date (ISO), category (planning|capital|demand|regulation|delivery), sentiment [-1,1], strength [1,100], sectors (non-empty string[]), summary",
      },
      { status: 400 },
    );
  }

  const sectors = normalizeSectorSlugs(parsed.sectors);
  if (sectors.length === 0) {
    return Response.json(
      {
        error: "validation_error",
        message:
          "No recognised sector slugs — use aliases like btr, housebuilders, or canonical slugs from /api/sectors",
      },
      { status: 400 },
    );
  }

  const date = new Date(parsed.date);
  const row = await prisma.rawSignal.create({
    data: {
      ...(parsed.id ? { id: parsed.id } : {}),
      title: parsed.title,
      source: parsed.source,
      date,
      category: parsed.category,
      sentiment: parsed.sentiment,
      strength: parsed.strength,
      sectors: JSON.stringify(sectors),
      summary: parsed.summary,
    },
  });

  return Response.json(
    {
      id: row.id,
      title: row.title,
      source: row.source,
      date: row.date.toISOString(),
      category: row.category,
      sentiment: row.sentiment,
      strength: row.strength,
      sectors,
      summary: row.summary,
      location:
        row.locationName != null && row.locationType != null
          ? { name: row.locationName, type: row.locationType }
          : undefined,
      createdAt: row.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
