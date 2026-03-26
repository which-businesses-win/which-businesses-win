import { applyMarketToDeal } from "@/lib/marketImpact";
import type { Sector } from "@/lib/sectors/types";

/** Market overlay on a deal — single product-facing object from GET /api/deals/:id */
export type DealMarketDriver = {
  text: string;
  type: "pos" | "neg";
  /** Magnitude for ordering / future explainability (from sector driver weight) */
  impact?: number;
};

/** Pillar scenario IRRs (same engine as `computeDealSensitivity`). */
export type DealMarketScenarios = {
  bull: number;
  base: number;
  bear: number;
};

export type DealMarketScores = {
  sector: number;
  geo: number;
};

/**
 * Canonical market contract — all deal APIs expose this shape under `deal.market`
 * (no top-level `adjustedIRR` / `irrAdjustment` in JSON).
 */
export type DealMarketCore = {
  adjustedIRR: number;
  uplift: number;
  scores: DealMarketScores;
  drivers: DealMarketDriver[];
  confidence: number;
};

/** Full `market` on GET /api/deals/:id — core + stressed + optional scenario overlay */
export type DealDetailMarket = DealMarketCore & {
  adjustedStressedIRR: number;
  scenarios?: DealMarketScenarios | null;
  riskNote?: string | null;
};

/** Operator layer — “what would I change?” (GET /api/deals/:id) */
export type DealActionType = "planning" | "design" | "phasing" | "cost";

export type DealAction = {
  text: string;
  /** Expected IRR delta from the move (percentage points) */
  impact: number;
  /** 0–1 */
  confidence: number;
  type?: DealActionType;
};

/** Bull / base / bear IRR from pillar scenario model (anchored to deal base IRR). */
export type DealSensitivitySummary = {
  bullIRR: number;
  baseIRR: number;
  bearIRR: number;
  /** True when bull–bear spread is wide — flag in UI */
  moderateSensitivity: boolean;
};

function sortDriversByImpact(drivers: DealMarketDriver[]): DealMarketDriver[] {
  return [...drivers].sort(
    (a, b) => Math.abs(b.impact ?? 0) - Math.abs(a.impact ?? 0),
  );
}

export function marketPayloadFromEngine(
  sector: Sector,
  m: ReturnType<typeof applyMarketToDeal>,
): DealDetailMarket {
  const driversRaw = sector.drivers.slice(0, 5).map((d) => {
    const row: DealMarketDriver = {
      text: d.title,
      type: d.type === "positive" ? "pos" : "neg",
    };
    if (typeof d.impact === "number" && Number.isFinite(d.impact)) {
      row.impact = d.impact;
    }
    return row;
  });
  const drivers = sortDriversByImpact(driversRaw);

  return {
    adjustedIRR: m.adjustedIRR,
    adjustedStressedIRR: m.adjustedStressedIRR,
    uplift: m.irrAdjustment,
    scores: {
      sector: m.sectorScore,
      geo: m.geoScore,
    },
    drivers,
    confidence: m.signal.confidence,
  };
}
