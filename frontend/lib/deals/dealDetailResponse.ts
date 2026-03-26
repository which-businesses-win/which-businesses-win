import { applyMarketToDeal } from "@/lib/marketImpact";
import type { Sector } from "@/lib/sectors/types";

/** Market overlay on a deal — single product-facing object from GET /api/deals/:id */
export type DealMarketDriver = {
  text: string;
  type: "pos" | "neg";
};

export type DealDetailMarket = {
  adjustedIRR: number;
  adjustedStressedIRR: number;
  /** IRR uplift in percentage points vs base (same as legacy irrAdjustment) */
  uplift: number;
  sectorScore: number;
  geoScore: number;
  drivers: DealMarketDriver[];
  confidence: number;
};

export function marketPayloadFromEngine(
  sector: Sector,
  m: ReturnType<typeof applyMarketToDeal>,
): DealDetailMarket {
  const drivers = sector.drivers.slice(0, 5).map((d) => ({
    text: d.title,
    type: d.type === "positive" ? ("pos" as const) : ("neg" as const),
  }));
  return {
    adjustedIRR: m.adjustedIRR,
    adjustedStressedIRR: m.adjustedStressedIRR,
    uplift: m.irrAdjustment,
    sectorScore: m.sectorScore,
    geoScore: m.geoScore,
    drivers,
    confidence: m.signal.confidence,
  };
}
