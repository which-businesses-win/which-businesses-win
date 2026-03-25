export type ConvictionLevel = "HIGH" | "MEDIUM" | "LOW";

export function getConviction(score: number): ConvictionLevel {
  if (score >= 80) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

/** Deal-level salience for top signals. */
export function getImpactFlag(score: number): string | null {
  if (score >= 85) return "THIS CHANGES THE DEAL";
  if (score >= 70) return "MATERIAL IMPACT";
  return null;
}
