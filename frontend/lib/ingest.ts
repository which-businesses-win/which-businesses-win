import Parser from "rss-parser";

const parser = new Parser();

export const FEEDS = [
  "https://www.planningresource.co.uk/rss",
  "https://www.propertyweek.com/rss",
  "https://feeds.bbci.co.uk/news/business/rss.xml",
];

export type IngestSignal = {
  title?: string;
  link?: string;
  source?: string;
  type: string;
  score: number;
  date?: string;
};

export function classify(title: string) {
  const t = title.toLowerCase();

  if (t.includes("planning") || t.includes("permission")) {
    return { type: "planning", score: 0.8 };
  }

  if (t.includes("interest rate") || t.includes("inflation")) {
    return { type: "macro", score: 0.6 };
  }

  if (t.includes("retail") || t.includes("store closures")) {
    return { type: "retail", score: 0.7 };
  }

  return { type: "general", score: 0.3 };
}

export async function getIngestSignals(): Promise<{ signals: IngestSignal[] }> {
  const results: IngestSignal[] = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items.slice(0, 5)) {
        const signal = classify(item.title || "");

        results.push({
          title: item.title,
          link: item.link,
          source: feed.title,
          type: signal.type,
          score: signal.score,
          date: item.pubDate,
        });
      }
    } catch (e) {
      console.error("Feed error:", url, e);
    }
  }

  return {
    signals: results.sort((a, b) => b.score - a.score),
  };
}
