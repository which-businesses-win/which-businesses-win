/**
 * Core sector / signal engine types — DB + API aligned.
 */

export type Driver = {
  title: string;
  /** Signed weight for explainability (magnitude of effect on score narrative) */
  impact: number;
  type: "positive" | "negative";
};

export type Metric = {
  score: number;
  delta: number;
};

export type SignalBreakdown = {
  planning: Metric;
  capital: Metric;
  demand: Metric;
  regulation: Metric;
  delivery: Metric;
};

export type ChangeEvent = {
  id: string;
  text: string;
  impact: number;
  /** ISO date string */
  date: string;
};

export type DealImpact = {
  irrDeltaMin: number;
  irrDeltaMax: number;
  planningRisk: "Low" | "Moderate" | "High";
  idealProjectSize: string;
};

/** Per-city headline score for a sector (geo layer). */
export type GeoScoreEntry = {
  location: string;
  score: number;
  /** vs last persisted geo snapshot for this sector + location */
  delta: number | null;
  label: string;
};

export type Sector = {
  id: string;
  name: string;
  slug: string;

  score: number;
  /** Week-on-week headline change; `null` when momentum not yet tracked */
  delta: number | null;
  confidence: number;

  /** 1 = best headline score after server sort */
  rank: number;

  drivers: Driver[];
  signals: SignalBreakdown;

  /** Geographic strength (canonical UK cities). Empty when no geo-specific signals yet. */
  geoScores: GeoScoreEntry[];

  strategy: string[];
  changes: ChangeEvent[];

  dealImpact: DealImpact;

  /** Panel-only v1 fields (until rankContext derived from DB) */
  rankContext?: string;
  signalCount?: number;
  displayTitle?: string;
  shortCode?: string;
};

export type SectorsListResponse = {
  sectors: Sector[];
};
