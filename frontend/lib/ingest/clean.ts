/** Strip basic HTML / tags from RSS bodies. */
export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pre–AI cleanup: cap length so the model stays deterministic and cheap. */
export function cleanArticleContent(content: string): string {
  return content.slice(0, 1000);
}
