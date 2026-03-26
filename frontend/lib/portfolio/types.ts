/** Aggregated portfolio view — multi-deal, signal-aware. */
export type PortfolioMetrics = {
  /** Sum of deal GDV (£ millions). */
  totalGDV: number;
  /** GDV-weighted mean base IRR (%). */
  avgIRR: number;
  /** GDV-weighted mean signal-adjusted IRR (%). */
  adjustedIRR: number;
  /** Label → share of GDV (0–1). */
  exposureBySector: Record<string, number>;
  /** Canonical city (or raw) → share of GDV (0–1). */
  exposureByLocation: Record<string, number>;
  /** 0–100 — higher = more concentrated / riskier. */
  riskScore: number;
};

export type PortfolioFlag = {
  type: "sector_concentration" | "geo_concentration";
  message: string;
  detail: string;
};

export type PortfolioMarketImpact = {
  /** Simple mean of per-deal IRR adjustments (% points). */
  avgIrrAdjustment: number;
  lines: string[];
};

export type PortfolioSensitivitySummary = {
  bullIRR: number;
  baseIRR: number;
  bearIRR: number;
  /** Base − bear (positive = downside vs base in bear scenario). */
  downsideVsBasePp: number;
  highDownside: boolean;
};

export type PortfolioPayload = {
  id: string;
  name: string;
  dealCount: number;
  metrics: PortfolioMetrics;
  marketImpact: PortfolioMarketImpact;
  sensitivity: PortfolioSensitivitySummary;
  flags: PortfolioFlag[];
  rebalancing: string[];
};
