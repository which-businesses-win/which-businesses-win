import {
  calculateDealSignalImpact,
  dealSignalAlert,
  findSectorForDeal,
} from "@/lib/deals/signalImpact";
import { computeDealSensitivity } from "@/lib/deals/sensitivity";
import {
  generateInvestmentMemo,
  type InvestmentMemo,
  type MemoPortfolioContext,
} from "@/lib/deals/investmentMemo";
import { prisma } from "@/lib/prisma";
import { buildPortfolioPayload } from "@/lib/portfolio/aggregate";
import { recomputeSectorsFromDb } from "@/lib/signals/recompute";
import type { DealSignalImpact } from "@/lib/deals/signalImpact";
import type { DealSensitivityResult } from "@/lib/deals/sensitivity";
import type { Sector } from "@/lib/sectors/types";

function sectorKey(sector: Sector | undefined, raw: string): string {
  if (!sector) return raw.trim();
  return sector.shortCode ?? sector.displayTitle ?? sector.name;
}

function formatMemoDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export type DealMemoFullPayload = {
  memo: InvestmentMemo;
  dealDisplayName: string;
  locationDisplay: string;
  matchError: string | null;
  /** Signal overlay vs neutral — mirrors JSON memo API. */
  alert: "upgraded" | "risk" | null;
  signalImpact: DealSignalImpact | null;
  sensitivity: DealSensitivityResult | null;
  irrAdjustment: number;
  adjustedIRR: number;
  dateLabel: string;
};

/**
 * Shared loader for JSON memo + PDF — one source of truth for deal, signals, scenarios.
 */
export async function buildDealMemoPayload(
  dealId: string,
): Promise<DealMemoFullPayload | null> {
  const [deal, allDeals, sectors] = await Promise.all([
    prisma.deal.findUnique({ where: { id: dealId } }),
    prisma.deal.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        sector: true,
        gdv: true,
        baseIRR: true,
        stressedIRR: true,
      },
    }),
    recomputeSectorsFromDb(),
  ]);

  if (!deal) return null;

  const sector = findSectorForDeal(deal.sector, sectors);
  const matchError = sector ? null : ("unknown_sector" as const);

  const portfolioPayload = buildPortfolioPayload(allDeals, sectors);
  const sk = sectorKey(sector, deal.sector);
  const share = portfolioPayload.metrics.exposureBySector[sk] ?? 0;
  const portfolio: MemoPortfolioContext | null =
    portfolioPayload.dealCount > 0
      ? {
          sectorLabel: sk,
          sectorExposurePct: share * 100,
          totalGDV: portfolioPayload.metrics.totalGDV,
        }
      : null;

  const dealDisplayName = deal.name ?? deal.location;
  const locationDisplay = deal.location.trim() || "UK";
  const dateLabel = formatMemoDate(new Date());

  if (!sector) {
    const memo = generateInvestmentMemo({
      deal: {
        name: dealDisplayName,
        location: deal.location,
        sector: deal.sector,
        gdv: deal.gdv,
        baseIRR: deal.baseIRR,
        stressedIRR: deal.stressedIRR,
        planningRisk: deal.planningRisk,
        decision: deal.decision,
      },
      signalImpact: null,
      adjustedIRR: deal.baseIRR,
      adjustedStressedIRR: deal.stressedIRR,
      sensitivity: null,
      sector: null,
      portfolio,
      matchError,
    });
    return {
      memo,
      dealDisplayName,
      locationDisplay,
      matchError,
      alert: null,
      signalImpact: null,
      sensitivity: null,
      irrAdjustment: 0,
      adjustedIRR: deal.baseIRR,
      dateLabel,
    };
  }

  const signalImpact = calculateDealSignalImpact(sector, deal.location);
  const adjustedIRR = deal.baseIRR + signalImpact.irrAdjustment;
  const adjustedStressedIRR = deal.stressedIRR + signalImpact.irrAdjustment;
  const sensitivity = computeDealSensitivity(deal.baseIRR, sector);

  const memo = generateInvestmentMemo({
    deal: {
      name: dealDisplayName,
      location: deal.location,
      sector: deal.sector,
      gdv: deal.gdv,
      baseIRR: deal.baseIRR,
      stressedIRR: deal.stressedIRR,
      planningRisk: deal.planningRisk,
      decision: deal.decision,
    },
    signalImpact,
    adjustedIRR,
    adjustedStressedIRR,
    sensitivity,
    sector,
    portfolio,
    matchError,
  });

  return {
    memo,
    dealDisplayName,
    locationDisplay,
    matchError,
    alert: dealSignalAlert(signalImpact.irrAdjustment),
    signalImpact,
    sensitivity,
    irrAdjustment: signalImpact.irrAdjustment,
    adjustedIRR,
    dateLabel,
  };
}
