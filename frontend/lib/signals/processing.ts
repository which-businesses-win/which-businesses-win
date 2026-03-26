import type { SignalBreakdown } from "@/lib/sectors/types";
import type { ChangeEvent, Driver } from "@/lib/sectors/types";
import type { LocationType } from "@/lib/signals/locationNormalize";
import type { RawSignal, SignalCategory } from "@/lib/signals/types";

export type RawSignalRow = {
  id: string;
  title: string;
  source: string;
  date: Date;
  category: string;
  sentiment: number;
  strength: number;
  sectors: string;
  summary: string;
  locationName: string | null;
  locationType: string | null;
};

export function parseSignalRow(row: RawSignalRow): RawSignalRow {
  return row;
}

export function rowToDomain(row: RawSignalRow): RawSignal {
  let sectors: string[] = [];
  try {
    sectors = JSON.parse(row.sectors) as string[];
  } catch {
    sectors = [];
  }
  const loc =
    row.locationName != null && row.locationType != null
      ? {
          name: row.locationName,
          type: row.locationType as LocationType,
        }
      : undefined;

  return {
    id: row.id,
    title: row.title,
    source: row.source,
    date: row.date.toISOString(),
    category: row.category as RawSignal["category"],
    sentiment: row.sentiment,
    strength: row.strength,
    sectors,
    summary: row.summary,
    ...(loc ? { location: loc } : {}),
  };
}

const CAT_TO_KEY: Record<SignalCategory, keyof SignalBreakdown> = {
  planning: "planning",
  capital: "capital",
  demand: "demand",
  regulation: "regulation",
  delivery: "delivery",
};

/**
 * Single nudge to one pillar — gradual, explainable.
 * impact = sentiment * (strength/100) * 10
 */
export function signalImpact(
  signal: Pick<RawSignal, "sentiment" | "strength">,
): number {
  return signal.sentiment * (signal.strength / 100) * 10;
}

export function applySignalToMetricScore(
  score: number,
  signal: Pick<RawSignal, "sentiment" | "strength">,
): number {
  const impact = signalImpact(signal);
  return Math.max(0, Math.min(100, score + impact));
}

export function applySignalToBreakdown(
  breakdown: SignalBreakdown,
  signal: Pick<RawSignal, "category" | "sentiment" | "strength">,
  opts?: { sentimentScale?: number },
): SignalBreakdown {
  const key = CAT_TO_KEY[signal.category];
  if (!key) return breakdown;
  const scale = opts?.sentimentScale ?? 1;
  const scaledSignal = {
    ...signal,
    sentiment: signal.sentiment * scale,
  };
  const next = cloneBreakdown(breakdown);
  next[key].score = applySignalToMetricScore(
    breakdown[key].score,
    scaledSignal,
  );
  return next;
}

export function cloneBreakdown(b: SignalBreakdown): SignalBreakdown {
  return {
    planning: { ...b.planning },
    capital: { ...b.capital },
    demand: { ...b.demand },
    regulation: { ...b.regulation },
    delivery: { ...b.delivery },
  };
}

export function generateDriversFromSignals(signals: RawSignal[]): Driver[] {
  return [...signals]
    .sort(
      (a, b) =>
        Math.abs(b.sentiment * b.strength) - Math.abs(a.sentiment * a.strength),
    )
    .slice(0, 3)
    .map((s) => ({
      title: s.summary,
      impact: Math.round(s.sentiment * 10),
      type: (s.sentiment > 0 ? "positive" : "negative") as Driver["type"],
    }));
}

export function buildChangeFeedFromSignals(signals: RawSignal[]): ChangeEvent[] {
  return [...signals]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      text: s.summary,
      impact: Math.round(s.sentiment * 10),
      date: s.date,
    }));
}
