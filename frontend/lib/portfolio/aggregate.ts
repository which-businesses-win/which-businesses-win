import {
  calculateDealSignalImpact,
  findSectorForDeal,
} from "@/lib/deals/signalImpact";
import { computeDealSensitivity } from "@/lib/deals/sensitivity";
import { normalizeLocationName } from "@/lib/signals/locationNormalize";
import type { Sector } from "@/lib/sectors/types";
import type {
  PortfolioDealSummary,
  PortfolioFlag,
  PortfolioMarketImpact,
  PortfolioMetrics,
  PortfolioPayload,
  PortfolioSensitivitySummary,
} from "@/lib/portfolio/types";

export type DealRow = {
  id: string;
  name: string | null;
  location: string;
  sector: string;
  gdv: number;
  baseIRR: number;
  stressedIRR: number;
};

/** GDV-weighted IRR — same logic as `calculatePortfolioIRR` in product spec */
export function calculatePortfolioIRR(
  deals: { gdv: number; irr: number }[],
): number {
  const total = deals.reduce((s, d) => s + Math.max(0, d.gdv), 0);
  if (total <= 0) return 0;
  return deals.reduce((acc, d) => {
    const w = Math.max(0, d.gdv) / total;
    return acc + d.irr * w;
  }, 0);
}

function sectorLabel(sector: Sector | undefined, fallback: string): string {
  if (!sector) return fallback;
  return (
    sector.shortCode ??
    sector.displayTitle ??
    sector.name
  );
}

function locationLabel(raw: string): string {
  const c = normalizeLocationName(raw);
  if (c && c !== "UK") return c;
  const t = raw.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "UK";
}

/**
 * Build exposure maps (shares of GDV) and weighted IRRs from live signal data.
 */
export function buildPortfolioPayload(
  deals: DealRow[],
  sectors: Sector[],
): PortfolioPayload {
  if (deals.length === 0) {
    return {
      id: "all",
      name: "All deals",
      dealCount: 0,
      deals: [],
      metrics: {
        totalGDV: 0,
        avgIRR: 0,
        adjustedIRR: 0,
        exposureBySector: {},
        exposureByLocation: {},
        riskScore: 0,
      },
      marketImpact: {
        avgIrrAdjustment: 0,
        lines: ["No deals recorded yet — add deals to see allocation."],
      },
      sensitivity: {
        bullIRR: 0,
        baseIRR: 0,
        bearIRR: 0,
        downsideVsBasePp: 0,
        highDownside: false,
      },
      flags: [],
      rebalancing: ["Record deals (with sector, location, GDV) to unlock portfolio actions."],
    };
  }

  const totalGDV = deals.reduce((s, d) => s + Math.max(0, d.gdv), 0);

  const perDeal: {
    id: string;
    sectorLabel: string;
    locationLabel: string;
    gdv: number;
    baseIRR: number;
    adjustedIRR: number;
    irrAdjustment: number;
  }[] = [];

  for (const d of deals) {
    const sector = findSectorForDeal(d.sector, sectors);
    const sl = sectorLabel(sector, d.sector);
    const ll = locationLabel(d.location);

    let adjustedIRR = d.baseIRR;
    let irrAdjustment = 0;
    if (sector) {
      const impact = calculateDealSignalImpact(sector, d.location);
      irrAdjustment = impact.irrAdjustment;
      adjustedIRR = d.baseIRR + irrAdjustment;
    }

    perDeal.push({
      id: d.id,
      sectorLabel: sl,
      locationLabel: ll,
      gdv: Math.max(0, d.gdv),
      baseIRR: d.baseIRR,
      adjustedIRR,
      irrAdjustment,
    });
  }

  const avgIRR = calculatePortfolioIRR(
    perDeal.map((p) => ({ gdv: p.gdv, irr: p.baseIRR })),
  );
  const adjustedIRR = calculatePortfolioIRR(
    perDeal.map((p) => ({ gdv: p.gdv, irr: p.adjustedIRR })),
  );

  const exposureBySector: Record<string, number> = {};
  const exposureByLocation: Record<string, number> = {};

  if (totalGDV > 0) {
    for (const p of perDeal) {
      const ws = (p.gdv / totalGDV);
      exposureBySector[p.sectorLabel] =
        (exposureBySector[p.sectorLabel] ?? 0) + ws;
      exposureByLocation[p.locationLabel] =
        (exposureByLocation[p.locationLabel] ?? 0) + ws;
    }
  }

  const maxSector = Math.max(0, ...Object.values(exposureBySector));
  const riskScore = Math.min(100, Math.round(maxSector * 100));

  const metrics: PortfolioMetrics = {
    totalGDV,
    avgIRR,
    adjustedIRR,
    exposureBySector,
    exposureByLocation,
    riskScore,
  };

  const avgIrrAdjustment =
    totalGDV > 0
      ? perDeal.reduce((s, p) => s + p.irrAdjustment * p.gdv, 0) / totalGDV
      : 0;

  const lines: string[] = [];
  const topSectors = Object.entries(exposureBySector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  for (const [label] of topSectors) {
    const dealInSector = perDeal.find((p) => p.sectorLabel === label);
    if (dealInSector && dealInSector.irrAdjustment > 0.2) {
      lines.push(`Strong ${label} performance vs neutral`);
    }
  }
  const topLocs = Object.entries(exposureByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);
  if (topLocs[0] && topLocs[0][1] > 0.25) {
    lines.push(`${topLocs[0][0]} outperformance in geo layer`);
  }
  if (lines.length === 0) {
    lines.push("Signal overlay blended across the book");
  }

  const marketImpact: PortfolioMarketImpact = {
    avgIrrAdjustment,
    lines: lines.slice(0, 3),
  };

  /** GDV-weighted scenario IRRs — denominator = GDV of deals with mapped sectors only. */
  let bullIRR = 0;
  let baseIRR = 0;
  let bearIRR = 0;
  const scenarioDeals = deals.filter((d) => findSectorForDeal(d.sector, sectors));
  const denomScen = scenarioDeals.reduce((s, d) => s + Math.max(0, d.gdv), 0);
  if (denomScen > 0) {
    for (const d of scenarioDeals) {
      const sector = findSectorForDeal(d.sector, sectors)!;
      const sens = computeDealSensitivity(d.baseIRR, sector);
      const w = Math.max(0, d.gdv) / denomScen;
      const b = sens.scenarios.find((x) => x.name === "Bull Case");
      const ba = sens.scenarios.find((x) => x.name === "Base Case");
      const be = sens.scenarios.find((x) => x.name === "Bear Case");
      if (b) bullIRR += b.irr * w;
      if (ba) baseIRR += ba.irr * w;
      if (be) bearIRR += be.irr * w;
    }
  }

  const downsideVsBasePp = baseIRR - bearIRR;
  const sensitivity: PortfolioSensitivitySummary = {
    bullIRR,
    baseIRR,
    bearIRR,
    downsideVsBasePp,
    highDownside: downsideVsBasePp > 3,
  };

  const flags: PortfolioFlag[] = [];
  for (const [label, share] of Object.entries(exposureBySector)) {
    if (share > 0.5) {
      flags.push({
        type: "sector_concentration",
        message: `Overexposed to ${label}`,
        detail: `${Math.round(share * 100)}% of GDV`,
      });
    }
  }
  for (const [loc, share] of Object.entries(exposureByLocation)) {
    if (share > 0.4) {
      flags.push({
        type: "geo_concentration",
        message: `Heavy reliance on ${loc}`,
        detail: `${Math.round(share * 100)}% of GDV`,
      });
    }
  }

  const rebalancing = buildRebalancingHints(
    exposureBySector,
    exposureByLocation,
    sectors,
  );

  const dealSummaries: PortfolioDealSummary[] = deals.map((d) => {
    const row = perDeal.find((p) => p.id === d.id)!;
    return {
      id: d.id,
      name: d.name?.trim() || d.location,
      sector: d.sector,
      location: d.location,
      gdv: row.gdv,
      baseIRR: row.baseIRR,
      adjustedIRR: row.adjustedIRR,
      uplift: row.irrAdjustment,
    };
  });

  return {
    id: "all",
    name: "All deals",
    dealCount: deals.length,
    deals: dealSummaries,
    metrics,
    marketImpact,
    sensitivity,
    flags,
    rebalancing,
  };
}

function buildRebalancingHints(
  exposureBySector: Record<string, number>,
  exposureByLocation: Record<string, number>,
  sectors: Sector[],
): string[] {
  const hints: string[] = [];

  for (const [label, v] of Object.entries(exposureBySector)) {
    if (v > 0.5) {
      const trim = Math.min(15, Math.round((v - 0.4) * 100));
      hints.push(`Reduce ${label} exposure by ~${trim}% of portfolio GDV toward a 40% cap.`);
    }
  }

  for (const [loc, v] of Object.entries(exposureByLocation)) {
    if (v > 0.4) {
      hints.push(`Diversify away from ${loc} — currently ~${Math.round(v * 100)}% of GDV.`);
    }
  }

  const thin = Object.entries(exposureBySector)
    .filter(([, v]) => v > 0 && v < 0.12)
    .sort((a, b) => a[1] - b[1]);
  if (thin.length) {
    hints.push(
      `Thin sleeves: ${thin.slice(0, 2).map(([k]) => k).join(", ")} — review scale-up or exit.`,
    );
  }

  const leedsHot = sectors.some((s) => {
    const g = s.geoScores.find((x) => x.location === "Leeds");
    return g != null && g.score >= 68;
  });
  if (leedsHot && (exposureByLocation["Leeds"] ?? 0) < 0.15) {
    hints.push(
      "Leeds geo scores are strong vs peers — consider adding exposure if strategy fits.",
    );
  }

  return hints.slice(0, 5);
}
