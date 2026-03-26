import { getMarketMeta } from "@/lib/marketMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const meta = await getMarketMeta();
  return Response.json(meta);
}
