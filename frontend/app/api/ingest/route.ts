import { getIngestSignals } from "@/lib/ingest";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getIngestSignals();
  return Response.json(data);
}
