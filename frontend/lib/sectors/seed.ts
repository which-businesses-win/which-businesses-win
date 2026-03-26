import { calculateScore } from "@/lib/sectors/engine";
import type {
  ChangeEvent,
  Driver,
  Sector,
  SignalBreakdown,
} from "@/lib/sectors/types";

function sb(
  p: [number, number],
  c: [number, number],
  d: [number, number],
  r: [number, number],
  e: [number, number],
): SignalBreakdown {
  return {
    planning: { score: p[0], delta: p[1] },
    capital: { score: c[0], delta: c[1] },
    demand: { score: d[0], delta: d[1] },
    regulation: { score: r[0], delta: r[1] },
    delivery: { score: e[0], delta: e[1] },
  };
}

function ch(
  id: string,
  text: string,
  impact: number,
  date: string,
): ChangeEvent {
  return { id, text, impact, date };
}

const RAW: Omit<Sector, "rank" | "score" | "geoScores">[] = [
  {
    id: "grid-batteries",
    name: "Grid Batteries",
    slug: "grid-batteries",
    delta: null,
    confidence: 76,
    drivers: [
      { title: "Grid constraint narrative dominant", impact: 3, type: "positive" },
      { title: "Storage procurement accelerating", impact: 2, type: "positive" },
      { title: "Policy support for flexibility assets", impact: 2, type: "positive" },
      { title: "Grid connection queue uncertainty", impact: -2, type: "negative" },
      { title: "Capital intensity / equipment lead times", impact: -1, type: "negative" },
    ],
    signals: sb([86, 2], [90, 3], [88, 4], [52, -1], [75, 2]),
    strategy: [
      "Prioritise sites with viable grid offers",
      "Lock equipment slots early",
      "Co-locate with generation where possible",
    ],
    changes: [
      ch("gb-1", "Capacity market chatter increasing", 1, "2026-03-20T10:00:00.000Z"),
    ],
    dealImpact: {
      irrDeltaMin: 2.0,
      irrDeltaMax: 4.0,
      planningRisk: "Moderate",
      idealProjectSize: "Industrial / edge-of-grid land",
    },
    rankContext: "Top cohort — strongest headline score",
    signalCount: 31,
    displayTitle: "Grid Batteries",
  },
  {
    id: "uk-housebuilders",
    name: "UK Housebuilders",
    slug: "uk-housebuilders",
    delta: 18,
    confidence: 79,
    drivers: [
      { title: "Planning reform narrative strengthening", impact: 3, type: "positive" },
      { title: "Land pipeline visibility improving", impact: 2, type: "positive" },
      { title: "Mortgage market stabilising vs prior year", impact: 1, type: "positive" },
      { title: "Build cost inflation still elevated", impact: -2, type: "negative" },
      { title: "Section 106 / affordable delivery pressure", impact: -1, type: "negative" },
    ],
    signals: sb([78, 3], [78, 2], [76, 1], [58, 0], [64, 1]),
    strategy: [
      "Bias to regions with faster consenting",
      "Pair with infrastructure-backed sites",
      "Stress-test on lower sales rates",
    ],
    changes: [
      ch("hb-1", "Reform headlines driving sentiment", 1, "2026-03-23T08:00:00.000Z"),
      ch("hb-2", "Materials index ticked up", -1, "2026-03-21T14:00:00.000Z"),
    ],
    dealImpact: {
      irrDeltaMin: 1.0,
      irrDeltaMax: 2.5,
      planningRisk: "High",
      idealProjectSize: "Suburban greenfield / edge-of-town",
    },
    rankContext: "Upper tier vs tracked sectors",
    signalCount: 52,
    displayTitle: "UK Housebuilders",
  },
  {
    id: "build-to-rent",
    name: "Build-to-Rent",
    slug: "build-to-rent",
    delta: 12,
    confidence: 82,
    drivers: [
      { title: "Capital inflows accelerating", impact: 3, type: "positive" },
      { title: "Rental demand structurally high", impact: 2, type: "positive" },
      { title: "Institutional appetite increasing", impact: 2, type: "positive" },
      { title: "Planning friction in certain boroughs", impact: -2, type: "negative" },
      { title: "Build cost pressure", impact: -1, type: "negative" },
    ],
    signals: sb([76, 2], [85, 4], [78, 2], [58, -1], [64, 1]),
    strategy: [
      "Acquire sites in undersupplied urban zones",
      "Target forward-funding structures",
      "Avoid high-CIL boroughs short-term",
    ],
    changes: [
      ch("btr-1", "Institutional capital inflows increased", 1, "2026-03-22T12:00:00.000Z"),
      ch("btr-2", "Camden BTR policy tightening", -1, "2026-03-20T09:00:00.000Z"),
      ch("btr-3", "Rent growth forecasts revised upward", 1, "2026-03-15T16:00:00.000Z"),
    ],
    dealImpact: {
      irrDeltaMin: 1.5,
      irrDeltaMax: 3.0,
      planningRisk: "Moderate",
      idealProjectSize: "50–200 unit schemes",
    },
    rankContext: "Top 10% of tracked sectors",
    signalCount: 47,
    displayTitle: "Build-to-Rent (BTR)",
    shortCode: "BTR",
  },
  {
    id: "small-landlords",
    name: "Small Landlords",
    slug: "small-landlords",
    delta: -6,
    confidence: 71,
    drivers: [
      { title: "Selective yield buyers still active", impact: 1, type: "positive" },
      { title: "Refinance options stabilising in pockets", impact: 1, type: "positive" },
      { title: "Regulatory + tax pressure on margins", impact: -3, type: "negative" },
      { title: "Section 24 / compliance burden", impact: -2, type: "negative" },
      { title: "Energy performance requirements tightening", impact: -2, type: "negative" },
    ],
    signals: sb([48, -1], [44, -1], [50, 0], [38, -2], [45, 0]),
    strategy: [
      "Avoid marginal yields without operational edge",
      "Target EPC / retrofit capex explicitly",
      "Prefer professionalised blocks over scattered lots",
    ],
    changes: [
      ch("sl-1", "Tax reporting noise increasing", -1, "2026-03-19T11:00:00.000Z"),
    ],
    dealImpact: {
      irrDeltaMin: -0.5,
      irrDeltaMax: 1.0,
      planningRisk: "High",
      idealProjectSize: "Only with strong net yield & capex plan",
    },
    rankContext: "Defensive — regulatory drag on returns",
    signalCount: 38,
    displayTitle: "Small Landlords",
  },
  {
    id: "high-street-retail",
    name: "High Street Retail",
    slug: "high-street-retail",
    delta: -22,
    confidence: 74,
    drivers: [
      { title: "Experiential / F&B pockets still working", impact: 1, type: "positive" },
      { title: "Selective investor interest in core towns", impact: 1, type: "positive" },
      { title: "Footfall + structural shift away from high street", impact: -3, type: "negative" },
      { title: "Omnichannel pressure on rents", impact: -2, type: "negative" },
      { title: "Rates / void risk in weaker locations", impact: -2, type: "negative" },
    ],
    signals: sb([52, 0], [35, -2], [32, -3], [48, 0], [40, -1]),
    strategy: [
      "Avoid pure retail reliance without covenant depth",
      "Seek mixed-use / residential upside routes",
      "Underwrite to stress footfall scenarios",
    ],
    changes: [
      ch("hsr-1", "Footfall indices soft in tier-2 towns", -1, "2026-03-18T13:00:00.000Z"),
    ],
    dealImpact: {
      irrDeltaMin: -2.0,
      irrDeltaMax: 0.5,
      planningRisk: "High",
      idealProjectSize: "Mixed-use only — not retail-only",
    },
    rankContext: "Structural headwinds — use caution",
    signalCount: 41,
    displayTitle: "High Street Retail",
  },
];

/** Unranked seed rows — score derived from `signals` */
export function getUnrankedSectors(): Sector[] {
  return RAW.map((row) => ({
    ...row,
    score: calculateScore(row.signals),
    rank: 0,
    geoScores: [],
  }));
}
