export type {
  ChangeEvent,
  DealImpact,
  Driver,
  GeoScoreEntry,
  Metric,
  Sector,
  SectorsListResponse,
  SignalBreakdown,
} from "@/lib/sectors/types";
export { assignRanks, calculateScore } from "@/lib/sectors/engine";
export { sectorToBoardRow } from "@/lib/sectors/mappers";
export { getSectorBySlug, listSectors } from "@/lib/sectors/service";
