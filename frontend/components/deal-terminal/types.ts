import type { DealSignalImpact } from "@/lib/deals/signalImpact";
import type { DealSensitivityResult } from "@/lib/deals/sensitivity";

/** Subset of GET /api/deals/:id used by DealTerminal */
export type DealTerminalModel = {
  deal: {
    name: string;
    location: string;
    sector: string;
    baseIRR: number;
    planningRisk: string;
    decision: string;
  };
  signalImpact: DealSignalImpact;
  adjustedIRR: number;
  adjustedStressedIRR: number;
  alert: "upgraded" | "risk" | null;
  sensitivity: DealSensitivityResult | null;
};
