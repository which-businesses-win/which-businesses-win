/** Per-deal row for portfolio transparency (subset of book). */
export type PortfolioDealSummary = {
  id: string;
  name: string;
  sector: string;
  location: string;
  /** £ millions — same units as stored GDV */
  gdv: number;
  baseIRR: number;
  adjustedIRR: number;
  /** IRR uplift from market overlay (pp) — aligns with deal `market.uplift` */
  uplift: number;
};

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
  /** GDV-weighted mean IRR uplift (% points) across the book */
  avgIrrAdjustment: number;
  /** Short driver lines for UI (no essays) */
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
  /** Book positions — same ordering as aggregation pass */
  deals: PortfolioDealSummary[];
  metrics: PortfolioMetrics;
  /** GDV-weighted mean uplift (pp) — headline “market lift” across capital */
  marketImpact: PortfolioMarketImpact;
  sensitivity: PortfolioSensitivitySummary;
  flags: PortfolioFlag[];
  rebalancing: string[];
};
