import Parser from "rss-parser";

import {
  generateChanges,
  type ChangeItem,
} from "@/lib/changes";
import {
  getConviction,
  getImpactFlag,
  type ConvictionLevel,
} from "@/lib/conviction";
import { prisma } from "@/lib/prisma";

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
  planningWeight: number;
  confidence: number;
  conviction: ConvictionLevel;
  impactFlag: string | null;
  reasons: string[];
  location?: string | null;
  date?: string;
};

/** Before conviction / impact-flag enrichment. */
type SignalRow = Omit<IngestSignal, "conviction" | "impactFlag">;

export type IngestOptions = {
  targetLocation?: string | null;
  targetSector?: string | null;
};

export type TrendRow = {
  type: string;
  location: string | null;
  count: number;
};

function parsePubDate(pubDate?: string): Date {
  if (!pubDate) return new Date();
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** UK planning–aware structured scoring (weighted, stacked). */
export function scoreSignal(title: string) {
  const t = title.toLowerCase();

  let score = 0;
  let type: string = "general";
  const reasons: string[] = [];
  let weight = 1;

  if (t.includes("refused")) {
    score += 50;
    type = "planning";
    reasons.push("Planning refusal (hard negative)");
    weight = 1.5;
  }

  if (t.includes("approved") || t.includes("granted")) {
    score += 35;
    type = "planning";
    reasons.push("Planning approval (positive comp)");
  }

  if (t.includes("appeal")) {
    score += 25;
    type = "planning";
    reasons.push("Appeal activity (policy uncertainty)");
  }

  if (t.includes("local plan") || t.includes("policy")) {
    score += 30;
    type = "planning";
    reasons.push("Policy shift signal");
  }

  if (t.includes("housing shortage") || t.includes("targets missed")) {
    score += 20;
    reasons.push("Supply pressure (positive for approvals)");
  }

  if (t.includes("closures") || t.includes("administration")) {
    score += 25;
    type = "retail";
    reasons.push("Retail distress (tenant risk)");
  }

  if (t.includes("interest rate") || t.includes("inflation")) {
    score += 15;
    if (type === "general") type = "macro";
    reasons.push("Macro pressure");
  }

  const weightedScore = Math.round(score * weight);
  const confidence = Math.min(weightedScore / 100, 1);

  return {
    type,
    score: weightedScore,
    confidence,
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
): Promise<{
  signals: IngestSignal[];
  insightSignals: IngestSignal[];
  trends: TrendRow[];
  changes: ChangeItem[];
}> {
  const targetLocation = options?.targetLocation?.trim() || null;
  const rawSector = options?.targetSector?.trim().toLowerCase() || null;
  const targetSector =
    rawSector && rawSector !== "general" ? rawSector : null;

  const results: SignalRow[] = [];

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

        let planningWeight = 0;
        if (type === "planning") {
          planningWeight = 20;
          reasons.push("Planning dominant factor");
        }

        const finalScore = score + relevance + planningWeight;
        const confidence = Math.min(finalScore / 100, 1);
        const signalDate = parsePubDate(item.pubDate);

        const rowTitle = title.trim() || "(untitled)";

        results.push({
          title,
          link: item.link,
          source: feed.title,
          type,
          score: finalScore,
          baseScore,
          relevance,
          planningWeight,
          confidence,
          reasons,
          location,
          date: item.pubDate,
        });

        try {
          const existing = await prisma.signal.findFirst({
            where: { title: rowTitle },
          });
          if (!existing) {
            await prisma.signal.create({
              data: {
                title: rowTitle,
                type,
                location,
                score: Math.round(Math.min(finalScore, 1_000_000)),
                confidence,
                date: signalDate,
              },
            });
          }
        } catch (persistErr) {
          console.error("Signal persist failed:", persistErr);
        }
      }
    } catch (e) {
      console.error("Feed error:", url, e);
    }
  }

  const rising = results.filter((s) => s.score > 70);

  const enriched: IngestSignal[] = results.map((s) => ({
    ...s,
    conviction: getConviction(s.score),
    impactFlag: getImpactFlag(s.score),
  }));

  const filtered = enriched
    .filter((s) => s.conviction !== "LOW")
    .sort((a, b) => b.score - a.score);

  const topSignals = filtered.slice(0, 5);
  const insightSignals = filtered;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let newTodaySignals: { id: string }[] = [];
  try {
    newTodaySignals = await prisma.signal.findMany({
      where: { firstSeen: { gte: startOfDay } },
      select: { id: true },
    });
  } catch (e) {
    console.error("New-today query failed:", e);
  }

  const changes = generateChanges(newTodaySignals, rising);

  let trends: TrendRow[] = [];
  try {
    const groups = await prisma.signal.groupBy({
      by: ["location", "type"],
      _count: { _all: true },
    });
    trends = groups
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 5)
      .map((g) => ({
        type: g.type,
        location: g.location,
        count: g._count._all,
      }));
  } catch (trendErr) {
    console.error("Trend aggregation failed:", trendErr);
  }

  return { signals: topSignals, insightSignals, trends, changes };
}
