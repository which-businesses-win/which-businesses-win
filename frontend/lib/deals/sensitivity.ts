import type { Sector } from "@/lib/sectors/types";

/** Scenario shifts on planning / capital / demand pillars only (directional, explainable). */
export type ScenarioShifts = {
  name: string;
  planningShift: number;
  capitalShift: number;
  demandShift: number;
};

export type ScenarioResult = ScenarioShifts & {
  irr: number;
  explanation: string;
};

export type DealSensitivityResult = {
  scenarios: ScenarioResult[];
  bullIRR: number;
  bearIRR: number;
  /** Bull − bear (percentage points on IRR). */
  spread: number;
  highVolatility: boolean;
};

const SCENARIO_TEMPLATES: ScenarioShifts[] = [
  {
    name: "Bull Case",
    planningShift: 10,
    capitalShift: 15,
    demandShift: 10,
  },
  {
    name: "Base Case",
    planningShift: 0,
    capitalShift: 0,
    demandShift: 0,
  },
  {
    name: "Bear Case",
    planningShift: -15,
    capitalShift: -10,
    demandShift: -10,
  },
];

const SCENARIO_COPY: Record<string, string> = {
  "Bull Case":
    "Planning loosens; capital inflows accelerate; rental / occupational demand strengthens.",
  "Base Case":
    "Pillars unchanged in this scenario — trajectory follows current signal scores.",
  "Bear Case":
    "Planning friction increases; funding tightens; demand softens vs today.",
};

function clampPillar(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * User formula: sum of (pillar score + shift) for planning, capital, demand;
 * impact = (average − 50) / 10; IRR = base + impact.
 */
export function calculateScenarioIrr(
  baseIRR: number,
  sector: Sector,
  shifts: ScenarioShifts,
): number {
  const p = clampPillar(
    sector.signals.planning.score + shifts.planningShift,
  );
  const c = clampPillar(sector.signals.capital.score + shifts.capitalShift);
  const d = clampPillar(sector.signals.demand.score + shifts.demandShift);
  const adjustedScore = p + c + d;
  const impact = (adjustedScore / 3 - 50) / 10;
  return baseIRR + impact;
}

/**
 * Widen bear / bull when live pillar momentum aligns (negative → harsher bear).
 */
function applyDynamicTrends(templates: ScenarioShifts[], sector: Sector): ScenarioShifts[] {
  const out = templates.map((t) => ({ ...t }));
  const bear = out.find((x) => x.name === "Bear Case");
  const bull = out.find((x) => x.name === "Bull Case");

  if (bear) {
    if (sector.signals.planning.delta < 0) bear.planningShift = -25;
    if (sector.signals.capital.delta < 0) bear.capitalShift = -15;
    if (sector.signals.demand.delta < 0) bear.demandShift = -15;
  }
  if (bull) {
    if (sector.signals.planning.delta > 0) {
      bull.planningShift = Math.min(20, bull.planningShift + 5);
    }
    if (sector.signals.capital.delta > 0) {
      bull.capitalShift = Math.min(20, bull.capitalShift + 5);
    }
    if (sector.signals.demand.delta > 0) {
      bull.demandShift = Math.min(20, bull.demandShift + 5);
    }
  }
  return out;
}

export function computeDealSensitivity(
  baseIRR: number,
  sector: Sector,
): DealSensitivityResult {
  const shifted = applyDynamicTrends(SCENARIO_TEMPLATES, sector);
  const scenarios: ScenarioResult[] = shifted.map((s) => ({
    ...s,
    irr: calculateScenarioIrr(baseIRR, sector, s),
    explanation: SCENARIO_COPY[s.name] ?? "",
  }));

  const bull = scenarios.find((x) => x.name === "Bull Case")!;
  const bear = scenarios.find((x) => x.name === "Bear Case")!;
  const spread = bull.irr - bear.irr;

  return {
    scenarios,
    bullIRR: bull.irr,
    bearIRR: bear.irr,
    spread,
    highVolatility: spread > 5,
  };
}
