export type ConvictionLevel = "HIGH" | "MEDIUM" | "LOW";

/** Stacking: richer reason sets + planning dominance lift adjusted score before bucketing. */
export function getAdjustedScore(score: number, reasons: string[]): number {
  let boost = 0;
  if (reasons.length >= 3) boost += 10;
  if (reasons.includes("Planning dominant factor")) boost += 15;
  return score + boost;
}

export function getConviction(score: number, reasons: string[]): ConvictionLevel {
  const adjusted = getAdjustedScore(score, reasons);
  if (adjusted >= 90) return "HIGH";
  if (adjusted >= 60) return "MEDIUM";
  return "LOW";
}

/** Uses adjusted score so flags align with conviction stacking. */
export function getImpactFlag(score: number, reasons: string[]): string | null {
  const adjusted = getAdjustedScore(score, reasons);
  if (adjusted >= 85) return "THIS CHANGES THE DEAL";
  if (adjusted >= 70) return "MATERIAL IMPACT";
  return null;
}
