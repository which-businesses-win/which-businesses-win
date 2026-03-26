import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { fetchAndStoreArticles } from "@/lib/ingest/fetchFeeds";
import { RSS_FEEDS } from "@/lib/ingest/rssFeeds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

async function handle(request: Request) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  const result = await fetchAndStoreArticles(RSS_FEEDS);
  return Response.json({
    ok: true,
    feeds: RSS_FEEDS.length,
    ...result,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
