import type { MarketSectorRow } from "@/lib/marketSignalsBoard";
import type { Sector } from "@/lib/sectors/types";

export function sectorToBoardRow(s: Sector): MarketSectorRow {
  const positives = s.drivers.filter((d) => d.type === "positive");
  const headline =
    positives
      .slice(0, 2)
      .map((d) => d.title)
      .join(" · ") ||
    s.drivers[0]?.title ||
    "—";
  return {
    id: s.slug,
    name: s.name,
    shortCode: s.shortCode,
    score: s.score,
    delta: s.delta,
    driver: headline,
  };
}
