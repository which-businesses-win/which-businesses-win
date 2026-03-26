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
import {
  extractLocation,
  isNearby,
  locationMatchScore,
  UK_LOCATIONS,
} from "@/lib/locationExtract";
import {
  calculateSiteMetrics,
  generateSiteInsight,
  type SiteInsight,
  type SiteMetrics,
} from "@/lib/siteAnalysis";
import {
  fetchPlanningEntities,
  planningEntityToSignalRow,
} from "@/lib/planningData";
import {
  detectClusters,
  detectPlanningPressure,
  inferRssDecisionType,
} from "@/lib/planningIntel";
import type {
  DecisionType,
  PlanningCluster,
  PlanningPressure,
} from "@/lib/planningIntel";
import {
  distanceKm,
  geocode,
  SITE_RADIUS_KM,
  type GeoCoords,
} from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { detectTrendShift } from "@/lib/trendShift";
import type { TrendShift } from "@/lib/trendShift";

const parser = new Parser();

export const FEEDS = [
  "https://www.planningresource.co.uk/rss",
  "https://www.theplanner.co.uk/feed",
  "https://www.propertyweek.com/rss",
  "https://feeds.bbci.co.uk/news/business/rss.xml",
];

export { UK_LOCATIONS, extractLocation };

export type { DecisionType, PlanningCluster, PlanningPressure } from "@/lib/planningIntel";
export type { SiteInsight, SiteMetrics } from "@/lib/siteAnalysis";
export type { GeoCoords } from "@/lib/geo";

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
  /** Structured planning direction when known (official + RSS inference). */
  decisionType?: DecisionType;
  /** Geocoded from `location` (Nominatim); used for radius-based site analysis. */
  coords?: GeoCoords | null;
};

/** Before conviction / impact-flag enrichment. */
export type SignalRow = Omit<IngestSignal, "conviction" | "impactFlag">;

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
    reasons.push("Nearby planning refusals increasing");
    weight = 1.5;
  }

  if (t.includes("approved") || t.includes("granted")) {
    score += 35;
    type = "planning";
    reasons.push("Local planning approvals (positive comps)");
  }

  if (t.includes("appeal")) {
    score += 25;
    type = "planning";
    reasons.push("Appeals in play — policy uncertainty");
  }

  if (t.includes("application") || t.includes("submitted")) {
    score += 15;
    if (type === "general") type = "planning";
    reasons.push("Active application pipeline");
  }

  if (t.includes("committee") || t.includes("decision")) {
    score += 20;
    type = "planning";
    reasons.push("Committee or decision in the news");
  }

  if (t.includes("local plan") || t.includes("policy")) {
    score += 30;
    type = "planning";
    reasons.push("Policy or local plan shift");
  }

  if (t.includes("housing shortage") || t.includes("targets missed")) {
    score += 20;
    reasons.push("Housing supply pressure (can help approvals)");
  }

  if (t.includes("closures") || t.includes("administration")) {
    score += 25;
    type = "retail";
    reasons.push("Retail demand weakening locally");
  }

  if (t.includes("interest rate") || t.includes("inflation")) {
    score += 15;
    if (type === "general") type = "macro";
    reasons.push("Financing and cost pressure (rates / inflation)");
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

export async function getIngestSignals(
  options?: IngestOptions,
): Promise<{
  signals: IngestSignal[];
  insightSignals: IngestSignal[];
  trends: TrendRow[];
  changes: ChangeItem[];
  trendShift: TrendShift | null;
  clusters: PlanningCluster[];
  pressure: PlanningPressure | null;
  nearbySignals: IngestSignal[];
  siteMetrics: SiteMetrics;
  siteInsight: SiteInsight | null;
  siteCoords: GeoCoords | null;
}> {
  const targetLocation = options?.targetLocation?.trim() || null;
  const rawSector = options?.targetSector?.trim().toLowerCase() || null;
  const targetSector =
    rawSector && rawSector !== "general" ? rawSector : null;

  const siteCoords = targetLocation ? await geocode(targetLocation) : null;

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

        if (isNearby(location, targetLocation)) {
          relevance += 40;
          reasons.push("Matches deal location");
        } else {
          const lm = locationMatchScore(location, targetLocation);
          if (lm === 20) {
            relevance += 20;
            reasons.push("Nearby market (regional proximity)");
          }
        }

        if (targetSector && type === targetSector) {
          relevance += 25;
          reasons.push("Sector match");
        }

        if (targetSector === "residential" && type === "planning") {
          relevance += 20;
          reasons.push("Residential investor: planning exposure");
        }

        if (targetSector === "retail" && type === "retail") {
          relevance += 20;
          reasons.push("Retail deal: sector-aligned signal");
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
        const rssDecision = inferRssDecisionType(title);

        let coords: GeoCoords | null = null;
        if (location) {
          coords = await geocode(location);
        }

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
          ...(rssDecision !== undefined ? { decisionType: rssDecision } : {}),
          ...(coords ? { coords } : {}),
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

  try {
    const entities = await fetchPlanningEntities();
    for (const app of entities) {
      const { row, persistTitle } = planningEntityToSignalRow(app, {
        targetLocation,
        targetSector,
      });
      let coords: GeoCoords | null = null;
      if (row.location) {
        coords = await geocode(row.location);
      }
      results.push({ ...row, ...(coords ? { coords } : {}) });
      const signalDate = parsePubDate(row.date);
      try {
        const existing = await prisma.signal.findFirst({
          where: { title: persistTitle },
        });
        if (!existing) {
          await prisma.signal.create({
            data: {
              title: persistTitle,
              type: row.type,
              location: row.location,
              score: Math.round(Math.min(row.score, 1_000_000)),
              confidence: row.confidence,
              date: signalDate,
            },
          });
        }
      } catch (persistErr) {
        console.error("Planning signal persist failed:", persistErr);
      }
    }
  } catch (e) {
    console.error("Planning ingest failed:", e);
  }

  const rising = results.filter((s) => s.score > 70);

  const trendShift = detectTrendShift(results);

  const enriched: IngestSignal[] = results.map((s) => ({
    ...s,
    conviction: getConviction(s.score, s.reasons),
    impactFlag: getImpactFlag(s.score, s.reasons),
  }));

  const filtered = enriched
    .filter((s) => s.conviction !== "LOW")
    .sort((a, b) => {
      const aBoost = a.reasons.includes("Source: UK Planning Data") ? 20 : 0;
      const bBoost = b.reasons.includes("Source: UK Planning Data") ? 20 : 0;
      return b.score + bBoost - (a.score + aBoost);
    });

  const topSignals = filtered.slice(0, 5);
  const insightSignals = filtered;

  const clusters = detectClusters(enriched);
  const pressure = detectPlanningPressure(enriched);

  const nearbySignals =
    targetLocation && siteCoords
      ? enriched.filter((s) => {
          if (!s.coords) return false;
          return distanceKm(siteCoords, s.coords) <= SITE_RADIUS_KM;
        })
      : [];
  const siteMetrics = calculateSiteMetrics(nearbySignals);
  const siteInsight = targetLocation
    ? siteCoords === null
      ? {
          level: "SITE NOT LOCATED",
          message:
            "Could not geocode this site. Try a fuller address or UK postcode.",
          action: "Check spelling or add a more specific place name.",
        }
      : generateSiteInsight(siteMetrics)
    : null;

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

  return {
    signals: topSignals,
    insightSignals,
    trends,
    changes,
    trendShift,
    clusters,
    pressure,
    nearbySignals,
    siteMetrics,
    siteInsight,
    siteCoords,
  };
}
