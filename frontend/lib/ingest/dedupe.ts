import crypto from "node:crypto";

/** Stable key so the same story is not inserted twice across cron runs. */
export function makeDedupeKey(
  link: string | undefined,
  title: string,
  isoDate: string,
): string {
  const raw = (link?.trim() || `${title}|${isoDate}`).toLowerCase();
  return crypto.createHash("sha256").update(raw).digest("hex");
}
