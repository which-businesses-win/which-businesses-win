/** Tailwind theme class for strength dot (sector / local score) */
export function dotStrengthClass(score: number): string {
  if (score >= 80) return "text-deal-green-hi";
  if (score >= 65) return "text-deal-green";
  return "text-deal-green-soft";
}
