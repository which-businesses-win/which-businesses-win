/**
 * Drop weak or unusable classifications before they hit `RawSignal`.
 */
export function evaluateGuardrails(
  signal: { strength: number; sectors: string[]; summary: string },
  existingSummariesLower: Set<string>,
): { ok: true } | { ok: false; reason: string } {
  if (signal.strength < 20) return { ok: false, reason: "strength_below_20" };
  if (signal.sectors.length === 0) return { ok: false, reason: "no_sector" };
  const summaryTrim = signal.summary.trim();
  if (!summaryTrim) return { ok: false, reason: "empty_summary" };
  if (existingSummariesLower.has(summaryTrim.toLowerCase())) {
    return { ok: false, reason: "duplicate_summary" };
  }
  return { ok: true };
}
