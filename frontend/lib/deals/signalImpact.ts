import { getSignalLabel } from "@/lib/marketSignalsBoard";
import { normalizeLocationName } from "@/lib/signals/locationNormalize";
import { normalizeSectorSlug } from "@/lib/signals/normalize";
import type { Sector } from "@/lib/sectors/types";

/**
 * Bridge from live sector + geo scores → financial readout (transparent, formula-based).
 */
export type DealSignalImpact = {
  sectorScore: number;
  geoScore: number;
  impactScore: number;
  /** Percentage points added to base IRR, e.g. +2.7 */
  irrAdjustment: number;
  confidence: number;
  sectorLabel: string;
  geoLabel: string;
  /** Canonical city used for geo lookup, if any */
  canonicalLocation: string | null;
  /** One-line explanation for the UI */
  narrative: string;
  /** Top driver lines from the sector (signal-derived) */
  driverHints: string[];
  /** Same drivers with sign for UI tape (+ green / − red) */
  driverTape: { text: string; sign: "+" | "−" }[];
};

export type DealSignalAlert = "upgraded" | "risk" | null;

/**
 * core: impactScore = 0.6 * sector + 0.4 * geo; irrAdjustment = (impactScore - 50) / 10
 */
export function calculateDealSignalImpact(
  sector: Sector,
  dealLocationRaw: string,
): DealSignalImpact {
  const canonical = normalizeLocationName(dealLocationRaw);
  const sectorScore = sector.score;
  const sectorBand = getSignalLabel(sectorScore);

  let geoScore = sectorScore;
  let geoLabel = sectorBand.label;
  if (canonical && canonical !== "UK") {
    const g = sector.geoScores.find((x) => x.location === canonical);
    if (g) {
      geoScore = g.score;
      geoLabel = g.label;
    }
  }

  const impactScore = sectorScore * 0.6 + geoScore * 0.4;
  const irrAdjustment = (impactScore - 50) / 10;

  const place = canonical && canonical !== "UK" ? canonical : "UK-wide";
  const narrative = `${sector.displayTitle ?? sector.name} · ${place} · ${sectorBand.label} · ${geoLabel} (${sectorScore}).`;

  const driverSlice = sector.drivers.slice(0, 5);
  const driverHints = driverSlice.map((d) => d.title);
  const driverTape = driverSlice.map((d) => ({
    text: d.title,
    sign: d.type === "positive" ? ("+" as const) : ("−" as const),
  }));

  return {
    sectorScore,
    geoScore,
    impactScore,
    irrAdjustment,
    confidence: sector.confidence,
    sectorLabel: sectorBand.label,
    geoLabel,
    canonicalLocation: canonical && canonical !== "UK" ? canonical : null,
    narrative,
    driverHints,
    driverTape,
  };
}

export function dealSignalAlert(irrAdjustment: number): DealSignalAlert {
  if (irrAdjustment > 2) return "upgraded";
  if (irrAdjustment < -2) return "risk";
  return null;
}

/** Resolve persisted deal.sector string to a ranked sector row. */
export function findSectorForDeal(
  sectorRaw: string,
  sectors: Sector[],
): Sector | undefined {
  const slug = normalizeSectorSlug(sectorRaw);
  if (slug) {
    const bySlug = sectors.find((x) => x.slug === slug);
    if (bySlug) return bySlug;
  }
  const lower = sectorRaw.trim().toLowerCase();
  return sectors.find(
    (x) =>
      x.slug === lower ||
      x.name.toLowerCase() === lower ||
      (x.shortCode && x.shortCode.toLowerCase() === lower),
  );
}
