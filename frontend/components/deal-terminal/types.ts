import type { DealAction, DealDetailMarket } from "@/lib/deals/dealDetailResponse";

/** Payload for DealTerminal — matches GET /api/deals/:id `deal` when `market` is present */
export type DealTerminalModel = {
  deal: {
    name: string;
    location: string;
    sector: string;
    baseIRR: number;
    stressedIRR: number;
    planningRisk: string;
    decision: string;
    market: DealDetailMarket;
    /** Operator layer — typically one item */
    actions?: DealAction[];
  };
};
