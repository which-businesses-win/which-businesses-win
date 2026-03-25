import { getIngestSignals } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const targetLocation = searchParams.get("location")?.toLowerCase() ?? undefined;
  const targetSector = searchParams.get("sector")?.toLowerCase() ?? undefined;

  const data = await getIngestSignals({
    targetLocation: targetLocation || null,
    targetSector: targetSector || null,
  });

  return Response.json(data);
}
