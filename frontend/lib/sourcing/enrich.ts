import {
  calculateDealSignalImpact,
  findSectorForDeal,
} from "@/lib/deals/signalImpact";
import { buildPortfolioPayload } from "@/lib/portfolio/aggregate";
import type { DealRow } from "@/lib/portfolio/aggregate";
import {
  calculateFitScore,
  calculateOverallScore,
  calculateRiskScore,
  headlineLabelForSector,
  volatilityFromPortfolioDownside,
} from "@/lib/sourcing/score";
import type { EnrichedDeal, IncomingDeal, OpportunityDetail } from "@/lib/sourcing/types";
import type { Sector } from "@/lib/sectors/types";

export type SourcedRow = {
  id: string;
  name: string;
  location: string;
  sector: string;
  gdv: number;
  units: number | null;
  description: string;
  source: string;
  date: Date;
  estimatedIRR: number;
};

function toIncoming(row: SourcedRow): IncomingDeal {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    sector: row.sector,
    gdv: row.gdv,
    units: row.units ?? undefined,
    description: row.description,
    source: row.source,
    date: row.date.toISOString(),
    estimatedIRR: row.estimatedIRR,
  };
}

export function enrichSourcedDeal(
  row: SourcedRow,
  sectors: Sector[],
  exposureBySector: Record<string, number>,
  marketVolatility01: number,
): EnrichedDeal | null {
  const sector = findSectorForDeal(row.sector, sectors);
  if (!sector) return null;

  const incoming = toIncoming(row);
  const impact = calculateDealSignalImpact(sector, row.location);
  const adjustedIRR = row.estimatedIRR + impact.irrAdjustment;

  const sl =
    sector.shortCode ?? sector.displayTitle ?? sector.name;

  const fitScore = calculateFitScore(sl, exposureBySector);
  const riskScore = calculateRiskScore(sector, marketVolatility01);
  const overallScore = calculateOverallScore(
    adjustedIRR,
    fitScore,
    sector.score,
    riskScore,
  );

  return {
    ...incoming,
    sectorScore: sector.score,
    geoScore: impact.geoScore,
    irrAdjustment: impact.irrAdjustment,
    adjustedIRR,
    riskScore,
    fitScore,
    overallScore,
    sectorLabel: sl,
    geoLabel: impact.geoLabel,
    headlineLabel: headlineLabelForSector(sector),
  };
}

export function buildWhyLines(
  enriched: EnrichedDeal,
  sector: Sector,
  exposureBySector: Record<string, number>,
): string[] {
  const lines: string[] = [];
  const exp = exposureBySector[enriched.sectorLabel] ?? 0;
  const place = enriched.location.trim() || "this market";
  lines.push(
    `Located in ${enriched.geoLabel.toLowerCase()} ${place} — geo score ${Math.round(enriched.geoScore)}.`,
  );
  lines.push(
    `${enriched.sectorLabel}: ${enriched.headlineLabel} (sector ${enriched.sectorScore}).`,
  );
  if (exp === 0) {
    lines.push("Portfolio is underweight this sleeve — fit boosted.");
  } else if (exp > 0.35) {
    lines.push("Book already has exposure here — fit discounted.");
  }
  const cap = sector.drivers.find((d) =>
    /capital|inflow|fund/i.test(d.title),
  );
  if (cap) {
    lines.push(`Capital flow signal: ${cap.title}.`);
  } else if (sector.drivers[0]) {
    lines.push(`Driver: ${sector.drivers[0].title}.`);
  }
  return lines.slice(0, 5);
}

export function buildOpportunityFlags(
  enriched: EnrichedDeal,
  exposureBySector: Record<string, number>,
  totalGDV: number,
  avgPortfolioRisk: number,
): string[] {
  const flags: string[] = [];
  const sl = enriched.sectorLabel;
  const current = exposureBySector[sl] ?? 0;
  const newTotal = totalGDV + enriched.gdv;
  const massInSector = current * totalGDV + enriched.gdv;
  const projected = newTotal > 0 ? massInSector / newTotal : 0;
  if (projected > 0.5) {
    flags.push(
      `Overexposed to ${sl} after this deal (~${Math.round(projected * 100)}% of GDV).`,
    );
  }
  if (enriched.riskScore > avgPortfolioRisk + 8) {
    flags.push("Planning risk above portfolio average.");
  }
  return flags;
}

/** Portfolio context for enrichment — reuse portfolio aggregate. */
export function getPortfolioContext(
  portfolioDeals: DealRow[],
  sectors: Sector[],
) {
  const payload = buildPortfolioPayload(portfolioDeals, sectors);
  const vol = volatilityFromPortfolioDownside(
    payload.sensitivity.downsideVsBasePp,
  );
  const withSec = portfolioDeals.filter((d) => findSectorForDeal(d.sector, sectors));
  const avgRisk =
    withSec.length === 0
      ? 45
      : withSec.reduce((s, d) => {
          const sec = findSectorForDeal(d.sector, sectors)!;
          return s + calculateRiskScore(sec, vol);
        }, 0) / withSec.length;

  return {
    exposure: payload.metrics.exposureBySector,
    totalGDV: payload.metrics.totalGDV,
    marketVolatility01: vol,
    avgPortfolioRisk: Number.isFinite(avgRisk) ? avgRisk : 45,
    payload,
  };
}

export function enrichAllSourced(
  rows: SourcedRow[],
  portfolioDeals: DealRow[],
  sectors: Sector[],
): EnrichedDeal[] {
  const ctx = getPortfolioContext(portfolioDeals, sectors);
  const out: EnrichedDeal[] = [];
  for (const row of rows) {
    const e = enrichSourcedDeal(
      row,
      sectors,
      ctx.exposure,
      ctx.marketVolatility01,
    );
    if (e) out.push(e);
  }
  return out.sort((a, b) => b.overallScore - a.overallScore);
}

export function buildOpportunityDetail(
  enriched: EnrichedDeal,
  sector: Sector,
  portfolioDeals: DealRow[],
  sectors: Sector[],
): OpportunityDetail {
  const ctx = getPortfolioContext(portfolioDeals, sectors);
  const why = buildWhyLines(enriched, sector, ctx.exposure);
  const flags = buildOpportunityFlags(
    enriched,
    ctx.exposure,
    ctx.totalGDV,
    ctx.avgPortfolioRisk,
  );
  return { deal: enriched, why, flags };
}
