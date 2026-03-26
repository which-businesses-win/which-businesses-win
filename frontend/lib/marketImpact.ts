import {
  calculateDealSignalImpact,
  type DealSignalImpact,
} from "@/lib/deals/signalImpact";
import type { Sector } from "@/lib/sectors/types";

export type DealForMarket = {
  baseIRR: number;
  stressedIRR: number;
  location: string;
};

/**
 * Core market overlay: 0.6×sector + 0.4×geo → impact score → IRR adjustment.
 * Single source of truth delegates to `calculateDealSignalImpact`.
 */
export function applyMarketToDeal(
  deal: DealForMarket,
  sectorData: Sector,
): {
  adjustedIRR: number;
  adjustedStressedIRR: number;
  irrAdjustment: number;
  sectorScore: number;
  geoScore: number;
  impactScore: number;
  sectorLabel: string;
  geoLabel: string;
  /** e.g. BTR */
  sectorShort: string;
  /** Canonical city used for geo, or null */
  cityLabel: string | null;
  /** Full signal bridge (drivers, narrative, confidence) */
  signal: DealSignalImpact;
} {
  const signal = calculateDealSignalImpact(sectorData, deal.location);
  const irrAdjustment = signal.irrAdjustment;
  const sectorShort =
    sectorData.shortCode ??
    (sectorData.displayTitle ?? sectorData.name).split(/\s+/)[0] ??
    sectorData.name;

  return {
    adjustedIRR: deal.baseIRR + irrAdjustment,
    adjustedStressedIRR: deal.stressedIRR + irrAdjustment,
    irrAdjustment,
    sectorScore: signal.sectorScore,
    geoScore: signal.geoScore,
    impactScore: signal.impactScore,
    sectorLabel: signal.sectorLabel,
    geoLabel: signal.geoLabel,
    sectorShort,
    cityLabel: signal.canonicalLocation,
    signal,
  };
}

/** One-line for APIs / PDFs */
export function marketImpactHeadline(
  m: ReturnType<typeof applyMarketToDeal>,
  sectorName: string,
): string {
  const city = m.cityLabel ?? "UK";
  const sign = m.irrAdjustment >= 0 ? "+" : "";
  return `${sign}${m.irrAdjustment.toFixed(1)}pp vs base · ${city} · ${sectorName}`;
}

/** Deal TL;DR middle line — scan-first */
export function tldrAlignmentLine(irrAdjustment: number): string {
  if (irrAdjustment >= 1) return "Strong alignment with current market conditions";
  if (irrAdjustment <= -1) return "Market working against base case";
  return "Neutral vs base case";
}

export function tldrDecisionVerb(decisionRaw: string): string {
  const d = decisionRaw.trim().toUpperCase();
  if (d === "PROCEED") return "Proceed";
  if (d === "CAUTION") return "Caution";
  if (d === "REJECT") return "Reject";
  const t = decisionRaw.trim();
  return t || "Review";
}

/** Short note for expanded “Recommendation” (still one screen, minimal words) */
export function marketAwareRecommendation(
  decisionRaw: string,
  irrAdjustment: number,
  sectorShort: string,
  geoCity: string | null,
): string {
  const d = decisionRaw.trim().toUpperCase();
  const loc = geoCity ?? "UK";
  if (d === "PROCEED" && irrAdjustment >= 1) {
    return `Proceed · market supportive · ${sectorShort} · ${loc}.`;
  }
  if (d === "PROCEED" && irrAdjustment <= -1) {
    return `Proceed · market headwind · ${sectorShort} · ${loc} · check underwriting.`;
  }
  if (d === "CAUTION") {
    return `Caution · ${irrAdjustment >= 0 ? "supportive" : "soft"} signals · ${sectorShort} · ${loc}.`;
  }
  if (d === "REJECT") {
    return `Reject · fundamentals first · Market Signal ${irrAdjustment >= 0 ? "+" : ""}${irrAdjustment.toFixed(1)}pp.`;
  }
  return `${tldrDecisionVerb(decisionRaw)} · Market Signal ${irrAdjustment >= 0 ? "+" : ""}${irrAdjustment.toFixed(1)}pp · ${sectorShort}.`;
}
