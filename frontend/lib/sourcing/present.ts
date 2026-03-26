import type { EnrichedDeal } from "@/lib/sourcing/types";

/** Short scan-first tags for the opportunities feed (no sentences). */
export function opportunityTags(e: EnrichedDeal): string[] {
  const tags: string[] = [];
  if (e.irrAdjustment >= 1) tags.push("Strong tailwind");
  else if (e.irrAdjustment <= -0.5) tags.push("Market headwind");
  if (e.fitScore >= 65) tags.push("High fit");
  else if (e.fitScore < 40) tags.push("Low fit");
  if (e.riskScore >= 58) tags.push("Planning risk elevated");
  else if (e.riskScore <= 35) tags.push("Lower risk profile");
  return tags.slice(0, 3);
}
