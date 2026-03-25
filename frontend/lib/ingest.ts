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
  confidence: number;
  reasons: string[];
  date?: string;
};

export function scoreSignal(title: string) {
  const t = title.toLowerCase();

  let score = 0;
  let type = "general";
  const reasons: string[] = [];

  // Planning signals (highest value)
  if (t.includes("planning") || t.includes("permission")) {
    score += 40;
    type = "planning";
    reasons.push("Planning signal detected");
  }

  if (t.includes("refused") || t.includes("rejected")) {
    score += 25;
    reasons.push("Negative planning outcome nearby");
  }

  if (t.includes("approved") || t.includes("granted")) {
    score += 20;
    reasons.push("Approval indicates local momentum");
  }

  // Macro
  if (t.includes("interest rate") || t.includes("inflation")) {
    score += 15;
    type = "macro";
    reasons.push("Macro pressure shift");
  }

  // Retail / business health
  if (t.includes("store closures") || t.includes("bankruptcy")) {
    score += 20;
    type = "retail";
    reasons.push("Demand destruction signal");
  }

  if (t.includes("expansion") || t.includes("growth")) {
    score += 15;
    reasons.push("Expansion signal");
  }

  // Scarcity / urgency
  if (t.includes("shortage") || t.includes("crisis")) {
    score += 10;
    reasons.push("Supply constraint");
  }

  return {
    type,
    score,
    confidence: Math.min(score / 100, 1),
    reasons,
  };
}

export async function getIngestSignals(): Promise<{ signals: IngestSignal[] }> {
  const results: IngestSignal[] = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items.slice(0, 5)) {
        const signal = scoreSignal(item.title || "");

        results.push({
          title: item.title,
          link: item.link,
          source: feed.title,
          type: signal.type,
          score: signal.score,
          confidence: signal.confidence,
          reasons: signal.reasons,
          date: item.pubDate,
        });
      }
    } catch (e) {
      console.error("Feed error:", url, e);
    }
  }

  results.sort((a, b) => b.score - a.score);

  return { signals: results };
}
