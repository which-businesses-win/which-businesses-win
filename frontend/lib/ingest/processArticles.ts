import { prisma } from "@/lib/prisma";
import { classifyArticle } from "@/lib/ingest/aiClassifier";
import { cleanArticleContent } from "@/lib/ingest/clean";
import { evaluateGuardrails } from "@/lib/ingest/guardrails";
import { normalizeLocationForStorage } from "@/lib/signals/locationNormalize";
import { normalizeSectorSlugs } from "@/lib/signals/normalize";
import { applySignalsPipeline } from "@/lib/signals/applyPipeline";

const BATCH = 25;

/**
 * Classify unprocessed `RawArticle` rows → `RawSignal`, then refresh sector scores + snapshot.
 */
export async function processUnprocessedArticles(): Promise<{
  scanned: number;
  signalsCreated: number;
  rejected: { reason: string }[];
  apply: { sectorCount: number; bucketDate: string };
  errors: { articleId: string; message: string }[];
}> {
  const articles = await prisma.rawArticle.findMany({
    where: { processed: false },
    orderBy: { date: "asc" },
    take: BATCH,
  });

  const rejected: { reason: string }[] = [];
  const errors: { articleId: string; message: string }[] = [];
  let signalsCreated = 0;

  const existing = await prisma.rawSignal.findMany({
    select: { summary: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const summaryLower = new Set(
    existing.map((s) => s.summary.trim().toLowerCase()),
  );

  for (const article of articles) {
    try {
      const body = cleanArticleContent(article.content);
      if (!body.trim()) {
        await prisma.rawArticle.update({
          where: { id: article.id },
          data: { processed: true },
        });
        rejected.push({ reason: "empty_content" });
        continue;
      }

      const classification = await classifyArticle(body);
      const sectors = normalizeSectorSlugs(classification.sectors);

      const guard = evaluateGuardrails(
        {
          strength: classification.strength,
          sectors,
          summary: classification.summary,
        },
        summaryLower,
      );

      if (!guard.ok) {
        await prisma.rawArticle.update({
          where: { id: article.id },
          data: { processed: true },
        });
        rejected.push({ reason: guard.reason });
        continue;
      }

      const summaryTrim = classification.summary.trim();
      const loc = normalizeLocationForStorage(classification.location);
      await prisma.rawSignal.create({
        data: {
          title: article.title.slice(0, 500),
          source: article.source,
          date: article.date,
          category: classification.category,
          sentiment: classification.sentiment,
          strength: classification.strength,
          sectors: JSON.stringify(sectors),
          summary: summaryTrim,
          locationName: loc.locationName,
          locationType: loc.locationType,
          articleId: article.id,
        },
      });
      summaryLower.add(summaryTrim.toLowerCase());
      signalsCreated++;

      await prisma.rawArticle.update({
        where: { id: article.id },
        data: { processed: true },
      });
    } catch (e) {
      errors.push({
        articleId: article.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const apply = await applySignalsPipeline();

  return {
    scanned: articles.length,
    signalsCreated,
    rejected,
    apply,
    errors,
  };
}
