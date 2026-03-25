import Parser from "rss-parser";

const parser = new Parser();

export const FEEDS = [
  "https://www.planningresource.co.uk/rss",
  "https://www.propertyweek.com/rss",
  "https://feeds.bbci.co.uk/news/business/rss.xml",
];

export const UK_LOCATIONS = [
  "london",
  "manchester",
  "birmingham",
  "leeds",
  "bristol",
  "liverpool",
  "sheffield",
  "nottingham",
  "cambridge",
  "oxford",
  "cornwall",
  "devon",
];

export function extractLocation(title: string): string | null {
  const t = title.toLowerCase();

  for (const loc of UK_LOCATIONS) {
    if (t.includes(loc)) {
      return loc;
    }
  }

  return null;
}

export type IngestSignal = {
  title?: string;
  link?: string;
  source?: string;
  type: string;
  score: number;
  baseScore: number;
  relevance: number;
  confidence: number;
  reasons: string[];
  location?: string | null;
  date?: string;
};

export type IngestOptions = {
  targetLocation?: string | null;
  targetSector?: string | null;
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

  if (
    type === "general" &&
    (t.includes("residential") || t.includes("housing"))
  ) {
    score += 12;
    type = "residential";
    reasons.push("Residential market signal");
  }

  return {
    type,
    score,
    confidence: Math.min(score / 100, 1),
    reasons,
  };
}

function locationMatchesDeal(
  extracted: string,
  target: string,
): boolean {
  const a = extracted.trim().toLowerCase();
  const b = target.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export async function getIngestSignals(
  options?: IngestOptions,
): Promise<{ signals: IngestSignal[] }> {
  const targetLocation = options?.targetLocation?.trim() || null;
  const rawSector = options?.targetSector?.trim().toLowerCase() || null;
  const targetSector =
    rawSector && rawSector !== "general" ? rawSector : null;

  const results: IngestSignal[] = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items.slice(0, 5)) {
        const title = item.title || "";
        const baseSig = scoreSignal(title);
        let score = baseSig.score;
        const reasons = [...baseSig.reasons];
        let type = baseSig.type;

        const location = extractLocation(title);

        if (location) {
          score += 15;
          reasons.push(`Location detected: ${location}`);
        }

        const baseScore = score;

        let relevance = 0;

        if (
          location &&
          targetLocation &&
          locationMatchesDeal(location, targetLocation)
        ) {
          relevance += 40;
          reasons.push("Matches deal location");
        }

        if (targetSector && type === targetSector) {
          relevance += 25;
          reasons.push("Sector match");
        }

        if (type === "planning") {
          relevance += 20;
        }

        const finalScore = score + relevance;

        results.push({
          title,
          link: item.link,
          source: feed.title,
          type,
          score: finalScore,
          baseScore,
          relevance,
          confidence: Math.min(finalScore / 100, 1),
          reasons,
          location,
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
