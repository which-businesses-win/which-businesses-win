/**
 * Market Signals board — labels + row shape. Rows from `GET /api/sectors`.
 */

export type SignalLabelColor =
  | "green"
  | "green-light"
  | "grey"
  | "orange"
  | "red";

export type MarketSectorRow = {
  id: string;
  name: string;
  /** Short code for display, e.g. BTR */
  shortCode?: string;
  score: number;
  /** Momentum (e.g. weekly points). Null = unknown / TBD in UI */
  delta: number | null;
  /** One-line driver — causality for the row */
  driver: string;
};

export function getSignalLabel(score: number): {
  label: string;
  color: SignalLabelColor;
} {
  if (score >= 80) return { label: "Strong Tailwind", color: "green" };
  if (score >= 65) return { label: "Favourable", color: "green-light" };
  if (score >= 50) return { label: "Neutral", color: "grey" };
  if (score >= 35) return { label: "Headwind", color: "orange" };
  return { label: "Structural Decline", color: "red" };
}

/** Primary: score desc. Secondary: momentum desc (when tracked). */
export function sortSectorsByScore(
  rows: MarketSectorRow[],
): MarketSectorRow[] {
  return [...rows].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const db = b.delta ?? -Infinity;
    const da = a.delta ?? -Infinity;
    return db - da;
  });
}

export function isTopMover(delta: number | null): boolean {
  return delta !== null && delta > 10;
}
