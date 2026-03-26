/**
 * Standardised market signal — ingestion → scoring → UI.
 */

import type { LocationType } from "@/lib/signals/locationNormalize";

export type SignalCategory =
  | "planning"
  | "capital"
  | "demand"
  | "regulation"
  | "delivery";

export type SignalLocation = {
  name: string;
  type: LocationType;
};

export type RawSignal = {
  id: string;
  title: string;
  source: string;
  /** ISO 8601 */
  date: string;
  category: SignalCategory;
  /** -1 … +1 */
  sentiment: number;
  /** 1 … 100 */
  strength: number;
  /** Sector slugs (canonical or aliases — normalised on ingest) */
  sectors: string[];
  summary: string;
  /** When omitted (legacy rows), treated as UK-wide. */
  location?: SignalLocation;
};

export type RawSignalIngestInput = Omit<RawSignal, "id"> & { id?: string };
