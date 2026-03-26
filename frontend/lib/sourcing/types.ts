/** Raw ingested row — listings, pipeline, planning-led schemes. */
export type IncomingDeal = {
  id: string;
  name: string;
  location: string;
  sector: string;
  gdv: number;
  units?: number;
  description: string;
  source: string;
  date: string;
  estimatedIRR: number;
};

export type EnrichedDeal = IncomingDeal & {
  sectorScore: number;
  geoScore: number;
  irrAdjustment: number;
  adjustedIRR: number;
  riskScore: number;
  fitScore: number;
  overallScore: number;
  sectorLabel: string;
  geoLabel: string;
  headlineLabel: string;
};

export type OpportunityDetail = {
  deal: EnrichedDeal;
  why: string[];
  flags: string[];
};
