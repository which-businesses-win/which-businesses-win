import type { DealAction, DealMarketDriver } from "@/lib/deals/dealDetailResponse";

type DriverLike = { text: string; type?: string; impact?: number };

/** Inputs needed to derive one operator action (GET /api/deals/:id). */
export type GenerateActionsDealInput = {
  market: { drivers: DealMarketDriver[] };
  units?: number | null;
  avgUnitSize?: number | null;
  siteArea?: number | null;
};

export function label(c: number): string {
  if (c > 0.75) return "likely achievable";
  if (c > 0.55) return "achievable";
  return "uncertain";
}

function magnitudePct(absImpact: number): 5 | 10 | 15 {
  if (absImpact > 2.5) return 15;
  if (absImpact > 1.5) return 10;
  return 5;
}

/** Density planning line: unit counts when `units` present; otherwise `action.text` (e.g. ~5/~10/~15%). */
function densityActionLine(action: DealAction, units?: number | null): string {
  if (action.type !== "planning") return action.text;
  if (units == null || units <= 0) return action.text;
  const reductionPercent = action.densityPct ?? 10;
  const newUnits = Math.round(units * (1 - reductionPercent / 100));
  return `Reduce from ${units} → ~${newUnits} units`;
}

/**
 * Final action line for UI — mirrors server logic (unit line when `deal.units` + density action).
 */
export function formatActionText(
  action: DealAction,
  deal: { units?: number | null },
): string {
  return densityActionLine(action, deal.units);
}

/**
 * One operator action: map **only** from the strongest negative driver; else a single generic fallback.
 * UI uses `actions[0]` only.
 */
export function generateActions(deal: GenerateActionsDealInput): DealAction[] {
  const drivers: DriverLike[] = deal.market?.drivers || [];

  const topNegative = [...drivers]
    .filter((d) => d.type === "neg")
    .sort(
      (a, b) => Math.abs(b.impact ?? 0) - Math.abs(a.impact ?? 0),
    )[0];

  if (!topNegative) {
    return [fallbackAction()];
  }

  const imp = topNegative.impact;
  if (
    typeof imp === "number" &&
    Number.isFinite(imp) &&
    Math.abs(imp) < 0.8
  ) {
    return [
      {
        text: "Refine scheme assumptions",
        impact: 0.5,
        confidence: 0.5,
        source: topNegative.text,
      },
    ];
  }

  const fromProblem = resolveFromTopNegative(topNegative);
  if (fromProblem) {
    const base = { ...fromProblem, source: topNegative.text };
    return [{ ...base, text: densityActionLine(base, deal.units) }];
  }

  return [{ ...fallbackAction(), source: topNegative.text }];
}

function resolveFromTopNegative(top: DriverLike): DealAction | null {
  const t = top.text.toLowerCase();
  const absImpact = Math.abs(top.impact ?? 0);
  const pct = magnitudePct(absImpact);

  if (
    t.includes("planning") ||
    t.includes("friction") ||
    t.includes("consent")
  ) {
    return {
      text: `Reduce density by ~${pct}%`,
      impact: 1.8,
      confidence: 0.72,
      type: "planning",
      densityPct: pct,
    };
  }

  if (
    t.includes("cost") ||
    t.includes("margin") ||
    t.includes("build") ||
    t.includes("capex")
  ) {
    return {
      text: "Lock structural package early",
      impact: 1.2,
      confidence: 0.65,
      type: "cost",
    };
  }

  if (
    t.includes("regulatory") ||
    t.includes("epc") ||
    t.includes("section 24")
  ) {
    return {
      text: "Shift mix toward 2-bed units",
      impact: 1.2,
      confidence: 0.65,
      type: "design",
    };
  }

  if (t.includes("footfall") || t.includes("omnichannel")) {
    return {
      text: "Reduce retail GIA; add residential upside",
      impact: 1.4,
      confidence: 0.61,
      type: "design",
    };
  }

  if (t.includes("connection") || t.includes("queue") || t.includes("cod")) {
    return {
      text: "Phase COD around grid offer",
      impact: 1.3,
      confidence: 0.63,
      type: "phasing",
    };
  }

  return null;
}

function fallbackAction(): DealAction {
  return {
    text: "Optimise unit mix toward demand",
    impact: 0.8,
    confidence: 0.5,
  };
}
