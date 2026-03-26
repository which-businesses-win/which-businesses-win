import Parser from "rss-parser";

import { prisma } from "@/lib/prisma";

import { stripHtml } from "@/lib/ingest/clean";
import { makeDedupeKey } from "@/lib/ingest/dedupe";
import type { RssFeed } from "@/lib/ingest/rssFeeds";

/**
 * Pull configured feeds and persist new rows into `RawArticle`.
 */
export async function fetchAndStoreArticles(feeds: RssFeed[]): Promise<{
  inserted: number;
  skipped: number;
  errors: { feed: string; message: string }[];
}> {
  const parser = new Parser({
    timeout: 25_000,
    headers: {
      "User-Agent": "WhichBusinessesWin/1.0 (signal-ingest; +https://example.com)",
    },
  });

  let inserted = 0;
  let skipped = 0;
  const errors: { feed: string; message: string }[] = [];

  for (const feed of feeds) {
    try {
      const data = await parser.parseURL(feed.url);
      for (const item of data.items ?? []) {
        const title = item.title?.trim() || "(no title)";
        const link = item.link?.trim();
        const rawBody =
          item.contentSnippet ||
          item.content ||
          item.summary ||
          item.title ||
          "";
        const content = stripHtml(rawBody);
        const pub = item.pubDate || item.isoDate;
        const d = pub ? new Date(pub) : new Date();
        if (Number.isNaN(d.getTime())) continue;

        const dedupeKey = makeDedupeKey(link, title, d.toISOString());
        const exists = await prisma.rawArticle.findUnique({
          where: { dedupeKey },
        });
        if (exists) {
          skipped++;
          continue;
        }

        await prisma.rawArticle.create({
          data: {
            title,
            content: content || title,
            source: feed.name,
            date: d,
            dedupeKey,
            processed: false,
          },
        });
        inserted++;
      }
    } catch (e) {
      errors.push({
        feed: feed.name,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { inserted, skipped, errors };
}
