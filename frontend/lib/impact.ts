import type { IngestSignal } from "@/lib/ingest";

export type DealImpact = {
  irrImpact: number;
  riskLevel: number;
  drivers: string[];
};

export function calculateImpact(signals: IngestSignal[]): DealImpact {
  let irrImpact = 0;
  let riskLevel = 0;
  const drivers: string[] = [];

  for (const s of signals) {
    if (
      s.type === "planning" &&
      s.reasons.includes("Negative planning outcome nearby")
    ) {
      irrImpact -= 1.2;
      riskLevel += 2;
      drivers.push("Planning refusal risk");
    }

    if (
      s.type === "planning" &&
      s.reasons.includes("Approval indicates local momentum")
    ) {
      irrImpact += 0.8;
      drivers.push("Planning momentum");
    }

    if (s.type === "retail") {
      irrImpact -= 0.7;
      riskLevel += 1;
      drivers.push("Retail demand weakening");
    }

    if (s.type === "macro") {
      irrImpact -= 0.5;
      drivers.push("Macro pressure (rates/inflation)");
    }
  }

  return {
    irrImpact: Number(irrImpact.toFixed(2)),
    riskLevel,
    drivers: [...new Set(drivers)],
  };
}
