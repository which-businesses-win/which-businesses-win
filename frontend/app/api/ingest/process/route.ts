import { unauthorizedIfCronOrInternalMismatch } from "@/lib/internalApiAuth";
import { processUnprocessedArticles } from "@/lib/ingest/processArticles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

async function handle(request: Request) {
  const denied = unauthorizedIfCronOrInternalMismatch(request);
  if (denied) return denied;

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return Response.json(
      {
        error: "not_configured",
        message: "Set OPENAI_API_KEY to run AI classification.",
      },
      { status: 503 },
    );
  }

  const result = await processUnprocessedArticles();
  return Response.json({
    ok: true,
    ...result,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
