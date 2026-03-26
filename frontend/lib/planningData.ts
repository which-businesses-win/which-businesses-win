import {
  extractLocation,
  isNearby,
  locationMatchScore,
} from "@/lib/locationExtract";
import type { DecisionType } from "@/lib/planningIntel";

/** Mirrors ingest `SignalRow` without importing ingest (avoids circular deps). */
export type PlanningSignalRow = {
  title?: string;
  link?: string;
  source?: string;
  type: string;
  score: number;
  baseScore: number;
  relevance: number;
  planningWeight: number;
  confidence: number;
  reasons: string[];
  location?: string | null;
  date?: string;
  decisionType: DecisionType;
};

const PLANNING_ENTITY_API =
  "https://www.planning.data.gov.uk/entity.json?dataset=planning-application&limit=10";

export type PlanningEntity = {
  entity: number;
  name?: string;
  description?: string;
  reference?: string;
  dataset?: string;
  "decision-date"?: string;
  [key: string]: unknown;
};

type Opts = {
  targetLocation: string | null;
  targetSector: string | null;
};

function collectDecisionText(app: PlanningEntity): string {
  const parts: string[] = [];
  const keys = [
    "decision",
    "decision-status",
    "planning-decision",
    "development-planning-decision",
    "description",
    "name",
  ] as const;
  for (const k of keys) {
    const v = app[k];
    if (typeof v === "string" && v.trim()) parts.push(v);
  }
  return parts.join(" ").toLowerCase();
}

/** Map ODP entity + free text to a structured decision (direction). */
export function inferPlanningDecisionType(
  app: PlanningEntity,
  blob: string,
): DecisionType {
  const fromFields = collectDecisionText(app);
  const b = `${fromFields} ${blob}`.toLowerCase();

  if (
    b.includes("refus") ||
    b.includes("reject") ||
    b.includes("refused")
  ) {
    return "refusal";
  }

  if (
    b.includes("grant") ||
    b.includes("approv") ||
    b.includes("permiss") ||
    b.includes("consent granted")
  ) {
    return "approval";
  }

  if (/\bappeal\b/.test(b)) {
    return "appeal";
  }

  return "unknown";
}

function parsePubDate(pubDate?: string): Date {
  if (!pubDate) return new Date();
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function fetchPlanningEntities(): Promise<PlanningEntity[]> {
  try {
    const res = await fetch(PLANNING_ENTITY_API, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("Planning data HTTP", res.status);
      return [];
    }
    const data = (await res.json()) as { entities?: PlanningEntity[] };
    return data.entities ?? [];
  } catch (e) {
    console.error("Planning data error", e);
    return [];
  }
}

export function planningEntityToSignalRow(
  app: PlanningEntity,
  opts: Opts,
): { row: PlanningSignalRow; persistTitle: string } {
  const title =
    (typeof app.description === "string" && app.description.trim()) ||
    (typeof app.name === "string" && app.name.trim()) ||
    `Planning application ${app.reference ?? app.entity}`;

  const targetLocation = opts.targetLocation;
  const targetSector = opts.targetSector;

  let score = 40;
  const reasons: string[] = [
    "Planning data (official source)",
    "Source: UK Planning Data",
  ];
  const type = "planning";

  const blob = `${title} ${String(app.description ?? "")}`.toLowerCase();
  const decisionType = inferPlanningDecisionType(app, blob);

  if (decisionType === "refusal") {
    score += 40;
    reasons.push("Nearby planning refusals increasing");
  } else if (decisionType === "approval") {
    score += 30;
    reasons.push("Local planning approvals (positive comps)");
  } else if (decisionType === "appeal") {
    score += 35;
    reasons.push("Appeal indicates policy weakness");
  }

  const location = extractLocation(title);

  let s = score;
  if (location) {
    s += 15;
    reasons.push(`Location detected: ${location}`);
  }

  const baseScore = s;
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

  if (targetSector === "retail") {
    if (
      blob.includes("retail") ||
      blob.includes("shop") ||
      blob.includes("high street") ||
      blob.includes("commercial")
    ) {
      relevance += 20;
      reasons.push("Retail deal: sector-aligned signal");
    }
  }

  const planningWeight = 20;
  reasons.push("Planning dominant factor");

  const finalScore = s + relevance + planningWeight;
  const confidence = Math.min(finalScore / 100, 1);

  const decisionDate =
    typeof app["decision-date"] === "string" ? app["decision-date"] : undefined;
  const pubDate = decisionDate ?? new Date().toISOString();

  const link = `https://www.planning.data.gov.uk/entity/${app.entity}`;

  const persistTitle = `${title.trim().slice(0, 400)} [${app.reference ?? app.entity}]`.trim();

  const row: PlanningSignalRow = {
    title,
    link,
    source: "UK Planning Data",
    type,
    score: finalScore,
    baseScore,
    relevance,
    planningWeight,
    confidence,
    reasons,
    location,
    date: pubDate,
    decisionType,
  };

  return { row, persistTitle };
}
