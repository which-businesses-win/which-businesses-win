/** Client-safe relative time for “Updated 2 hours ago”. */
export function formatRelativeTime(iso: string, nowMs = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "recently";
  const s = Math.floor((nowMs - t) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} minutes ago`;
  if (s < 86400) return `${Math.max(1, Math.floor(s / 3600))} hours ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
