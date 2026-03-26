import type { IngestSignal } from "@/lib/ingest";

export type DealImpact = {
  irrImpact: number;
  riskLevel: number;
  drivers: string[];
};

function isPlanningRefusal(s: IngestSignal): boolean {
  if (s.type !== "planning") return false;
  if (s.decisionType === "refusal") return true;
  return s.reasons.some((r) => /refusal/i.test(r));
}

function isPlanningApproval(s: IngestSignal): boolean {
  if (s.type !== "planning") return false;
  if (s.decisionType === "approval") return true;
  return s.reasons.some((r) => /approval|granted|approv/i.test(r));
}

export function calculateImpact(signals: IngestSignal[]): DealImpact {
  let irrImpact = 0;
  let riskLevel = 0;
  const drivers: string[] = [];

  for (const s of signals) {
    if (s.type === "planning") {
      if (isPlanningRefusal(s)) {
        irrImpact -= 2.0;
        riskLevel += 3;
        drivers.push("Nearby planning refusals weigh on the deal");
      } else if (isPlanningApproval(s)) {
        irrImpact += 1.2;
        drivers.push("Local approvals support your planning case");
      }
    }

    if (s.type === "retail") {
      irrImpact -= 0.7;
      riskLevel += 1;
      drivers.push("Retail demand weakening locally");
    }

    if (s.type === "macro") {
      irrImpact -= 0.5;
      drivers.push("Financing and cost pressure (rates / inflation)");
    }
  }

  return {
    irrImpact: Number(irrImpact.toFixed(2)),
    riskLevel,
    drivers: [...new Set(drivers)],
  };
}
