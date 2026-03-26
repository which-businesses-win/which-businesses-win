import type { DealAction } from "@/lib/deals/dealDetailResponse";

type DriverLike = { text: string; type?: string; impact?: number };

export function label(c: number): string {
  if (c > 0.75) return "likely achievable";
  if (c > 0.55) return "achievable";
  return "uncertain";
}

/**
 * One operator action: prefer **strongest negative driver** (the problem), else tailwind on positives, else fallback.
 * UI uses `actions[0]` only.
 */
export function generateActions(deal: any): DealAction[] {
  const drivers: DriverLike[] = deal.market?.drivers || [];

  const topNegative = [...drivers]
    .filter((d) => d.type === "neg")
    .sort(
      (a, b) => Math.abs(b.impact ?? 0) - Math.abs(a.impact ?? 0),
    )[0];

  const fromProblem = resolveFromTopNegative(topNegative);
  if (fromProblem) {
    return [fromProblem];
  }

  return [fallbackFromDrivers(drivers)];
}

function resolveFromTopNegative(top: DriverLike | undefined): DealAction | null {
  if (!top) return null;
  const t = top.text.toLowerCase();

  if (
    t.includes("planning") ||
    t.includes("friction") ||
    t.includes("consent")
  ) {
    return {
      text: "Reduce density ~10%",
      impact: 1.8,
      confidence: 0.72,
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
    };
  }

  if (t.includes("footfall") || t.includes("omnichannel")) {
    return {
      text: "Reduce retail GIA; add residential upside",
      impact: 1.4,
      confidence: 0.61,
    };
  }

  if (t.includes("connection") || t.includes("queue") || t.includes("cod")) {
    return {
      text: "Phase COD around grid offer",
      impact: 1.3,
      confidence: 0.63,
    };
  }

  return null;
}

/** When no negative maps cleanly — use positive tailwinds, then generic fallback */
function fallbackFromDrivers(drivers: DriverLike[]): DealAction {
  const hasCapital = drivers.some(
    (d) =>
      d.type === "pos" &&
      d.text.toLowerCase().includes("capital"),
  );
  const hasDemand = drivers.some(
    (d) =>
      d.type === "pos" &&
      d.text.toLowerCase().includes("demand"),
  );

  if (hasCapital) {
    return {
      text: "Phase delivery forward",
      impact: 1.0,
      confidence: 0.6,
    };
  }
  if (hasDemand) {
    return {
      text: "Shift mix toward 2-bed units",
      impact: 1.2,
      confidence: 0.65,
    };
  }

  return {
    text: "Optimise unit mix",
    impact: 0.8,
    confidence: 0.5,
  };
}
