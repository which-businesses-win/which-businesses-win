import type { DealSignalImpact } from "@/lib/deals/signalImpact";
import type { DealSensitivityResult } from "@/lib/deals/sensitivity";
import type { Sector } from "@/lib/sectors/types";

export type InvestmentMemoSections = {
  overview: string;
  market: string;
  financials: string;
  risks: string;
  scenarios: string;
  recommendation: string;
};

export type InvestmentMemo = {
  title: string;
  summary: string;
  sections: InvestmentMemoSections;
};

export type MemoPortfolioContext = {
  sectorLabel: string;
  /** Current book share of this sector, 0–100 */
  sectorExposurePct: number;
  totalGDV: number;
};

export type MemoGenerationInput = {
  deal: {
    name: string;
    location: string;
    sector: string;
    gdv: number;
    baseIRR: number;
    stressedIRR: number;
    planningRisk: string;
    decision: string;
  };
  signalImpact: DealSignalImpact | null;
  adjustedIRR: number;
  adjustedStressedIRR: number;
  sensitivity: DealSensitivityResult | null;
  sector: Sector | null;
  portfolio: MemoPortfolioContext | null;
  matchError: string | null;
};

function fmtMoneyM(gdv: number): string {
  if (gdv >= 100) return `£${gdv.toFixed(0)}M`;
  return `£${gdv.toFixed(1)}M`;
}

function sectorHeadlineName(s: Sector): string {
  return s.displayTitle ?? s.name;
}

function planningRiskTone(risk: string): "high" | "moderate" | "low" {
  const u = risk.toUpperCase();
  if (u.includes("HIGH")) return "high";
  if (u.includes("LOW")) return "low";
  return "moderate";
}

function recommendationVerb(
  input: MemoGenerationInput,
): "proceed" | "caution" | "hold" {
  const pr = planningRiskTone(input.deal.planningRisk);
  const adj = input.signalImpact?.irrAdjustment ?? 0;
  if (pr === "high" && adj < -1) return "hold";
  if (pr === "high" || input.deal.decision.toLowerCase().includes("reject"))
    return "caution";
  if (adj < -2) return "caution";
  return "proceed";
}

function buildSummary(input: MemoGenerationInput): string {
  const { deal, signalImpact, adjustedIRR, portfolio, matchError } = input;
  const name = deal.name || `${deal.location} — ${deal.sector}`;
  const irrAdj = signalImpact?.irrAdjustment ?? 0;
  const drivers =
    signalImpact?.driverHints.slice(0, 2).join("; ") ||
    "See deal thesis — limited live driver text.";
  const pr = planningRiskTone(deal.planningRisk);
  const prPhrase =
    pr === "high"
      ? "Elevated planning risk — diligence on consent path is critical."
      : pr === "low"
        ? "Planning risk appears contained vs typical UK schemes."
        : "Moderate planning risk — standard validation steps apply.";

  const sectorName = input.sector
    ? sectorHeadlineName(input.sector)
    : deal.sector;
  const para1 = `${name}: ${sectorName} — ${deal.location.trim() || "UK"}.`;

  const para2 = signalImpact
    ? `Market-adjusted IRR ${adjustedIRR.toFixed(1)}% (${irrAdj >= 0 ? "+" : ""}${irrAdj.toFixed(1)}pp from live sector + location signals). ${drivers}.`
    : `Base IRR ${deal.baseIRR.toFixed(1)}% — signal bridge unavailable (${matchError ?? "no sector match"}); figures exclude market overlay.`;

  const para3 = `${prPhrase} Signal confidence on overlay: ${signalImpact ? `${signalImpact.confidence}%` : "n/a"}.`;

  let para4 = "";
  if (portfolio && portfolio.sectorExposurePct > 40) {
    para4 = ` Book is ~${Math.round(portfolio.sectorExposurePct)}% ${portfolio.sectorLabel} by GDV — concentration is material.`;
  } else if (portfolio && portfolio.sectorExposurePct < 12 && portfolio.totalGDV > 0) {
    para4 = ` ${portfolio.sectorLabel} remains a thin sleeve vs total GDV — additive if strategy fits.`;
  }

  return [para1, para2, para3 + para4].filter(Boolean).join("\n\n");
}

function buildOverview(input: MemoGenerationInput): string {
  const d = input.deal;
  const lines = [
    `Location: ${d.location.trim() || "—"}`,
    `Sector: ${d.sector}`,
    `GDV: ${fmtMoneyM(d.gdv)}`,
    "",
    `Base IRR: ${d.baseIRR.toFixed(1)}%`,
    input.signalImpact
      ? `Market-adjusted IRR: ${input.adjustedIRR.toFixed(1)}%`
      : `Market-adjusted IRR: — (signals not applied)`,
    `Stressed IRR: ${input.adjustedStressedIRR.toFixed(1)}%`,
    `Planning risk (recorded): ${d.planningRisk}`,
    `Prior decision flag: ${d.decision}`,
  ];
  return lines.join("\n");
}

function buildMarket(input: MemoGenerationInput): string {
  const si = input.signalImpact;
  const sector = input.sector;
  if (!si || !sector) {
    return [
      "Live sector + geo overlay could not be applied — memo uses static deal fields only.",
      "",
      input.matchError
        ? `Reason: ${input.matchError.replace(/_/g, " ")}.`
        : "Map deal.sector to a market sector slug to unlock signal-backed context.",
    ].join("\n");
  }

  const place = si.canonicalLocation ?? "UK-wide";
  const drivers = [
    ...si.driverHints.map((t) => `+ ${t}`),
    ...sector.drivers.slice(0, 2).map((dr) =>
      `${dr.type === "negative" ? "−" : "+"} ${dr.title}`,
    ),
  ].slice(0, 5);

  const changeLines = sector.changes.slice(0, 4).map((c) => {
    const sign = c.impact >= 0 ? "+" : "−";
    const ago = c.date ? ` (${c.date.slice(0, 10)})` : "";
    return `${sign} ${c.text}${ago}`;
  });

  const head = [
    `Sector (${sectorHeadlineName(sector)}): ${si.sectorLabel} (${Math.round(si.sectorScore)})`,
    `Location (${place}): ${si.geoLabel} (${Math.round(si.geoScore)})`,
    "",
    "Key drivers:",
    ...drivers,
    "",
    "Recent changes:",
    ...(changeLines.length ? changeLines : ["No recent change events recorded for this sector."]),
  ];
  return head.join("\n");
}

function buildFinancials(input: MemoGenerationInput): string {
  const si = input.signalImpact;
  if (!si) {
    return [
      "Market-conditions IRR uplift: not applied (sector mapping required).",
      "",
      `Underwriting should reference base IRR ${input.deal.baseIRR.toFixed(1)}% until signals attach.`,
    ].join("\n");
  }
  const adj = si.irrAdjustment;
  const lines = [
    `Market-conditions IRR uplift: ${adj >= 0 ? "+" : ""}${adj.toFixed(1)}pp`,
    "",
    "Primary drivers:",
    `→ Sector score ${Math.round(si.sectorScore)} (${si.sectorLabel})`,
    `→ Location overlay ${Math.round(si.geoScore)} (${si.geoLabel})`,
    "",
    `Signal confidence: ${si.confidence}%`,
  ];
  return lines.join("\n");
}

function buildRisks(input: MemoGenerationInput): string {
  const bullets: string[] = [];
  const pr = planningRiskTone(input.deal.planningRisk);
  bullets.push(
    pr === "high"
      ? "Planning / consent path may extend timeline or cap value — align legal and technical DD."
      : pr === "low"
        ? "Planning risk flagged low on file — still verify against latest LPA practice."
        : "Planning risk assessed as moderate — standard milestone gating recommended.",
  );

  if (input.sector) {
    const p = input.sector.signals.planning.score;
    if (p < 42) {
      bullets.push(
        `Sector planning pillar is weak (${Math.round(p)}) — local friction may reinforce file risk.`,
      );
    }
    const del = input.sector.signals.delivery.score;
    if (del < 45) {
      bullets.push(
        `Delivery / cost pressure in sector signals (${Math.round(del)}) — protect margin in build pricing.`,
      );
    }
  }

  const spread = input.sensitivity?.spread ?? 0;
  if (spread > 5) {
    bullets.push(
      `Scenario spread ${spread.toFixed(1)}pp (bull vs bear) — base case sensitive to planning and funding.`,
    );
  }

  if (input.portfolio && input.portfolio.sectorExposurePct > 35) {
    bullets.push(
      `Portfolio concentration: ~${Math.round(input.portfolio.sectorExposurePct)}% of GDV in ${input.portfolio.sectorLabel} — incremental deals add correlation.`,
    );
  }

  if (input.adjustedStressedIRR < input.deal.baseIRR - 2) {
    bullets.push(
      `Stressed IRR ${input.adjustedStressedIRR.toFixed(1)}% vs base — stress case bites if overlays worsen.`,
    );
  }

  return bullets.map((b) => `- ${b}`).join("\n");
}

function buildScenarios(input: MemoGenerationInput): string {
  const sen = input.sensitivity;
  if (!sen) {
    return "Scenario ladder not available — sector mapping required for pillar-based bull / base / bear IRRs.";
  }
  const bull = sen.scenarios.find((x) => x.name === "Bull Case");
  const base = sen.scenarios.find((x) => x.name === "Base Case");
  const bear = sen.scenarios.find((x) => x.name === "Bear Case");
  if (!bull || !base || !bear) {
    return "Incomplete scenario set.";
  }
  return [
    `Bull case: ${bull.irr.toFixed(1)}%`,
    `Base case: ${base.irr.toFixed(1)}%`,
    `Bear case: ${bear.irr.toFixed(1)}%`,
    "",
    "Downside is driven by planning friction and capital tightening when bear assumptions bind; bull assumes supportive pillars vs today.",
  ].join("\n");
}

function buildRecommendation(input: MemoGenerationInput): string {
  const verb = recommendationVerb(input);
  const pr = planningRiskTone(input.deal.planningRisk);
  const si = input.signalImpact;

  let lead =
    verb === "proceed"
      ? "Proceed toward acquisition subject to planning validation, build pricing, and legal sign-off on title and consent."
      : verb === "caution"
        ? "Proceed only with explicit planning and funding mitigations — IC should set clear kill criteria."
        : "Do not advance without revised underwriting or improved signal / planning clarity.";

  if (verb === "proceed" && pr === "high") {
    lead =
      "Proceed only after planning milestones are de-risked — elevated file risk vs typical book.";
  }

  const align =
    si && si.irrAdjustment >= 0
      ? "Current market signals are supportive of headline returns vs neutral."
      : si && si.irrAdjustment < 0
        ? "Market overlay is negative vs baseline — returns rely on idiosyncratic upside or cost discipline."
        : "Reconcile base case without signal uplift before IC.";

  const tail: string[] = [align];
  if (input.portfolio && input.portfolio.sectorExposurePct > 40) {
    tail.push(
      `Limit further ${input.portfolio.sectorLabel} exposure beyond this ticket until sleeve is rebalanced.`,
    );
  }

  return [lead, "", ...tail].join("\n");
}

/**
 * Deterministic memo assembly from deal, signals, scenarios, and portfolio — no LLM.
 */
export function generateInvestmentMemo(input: MemoGenerationInput): InvestmentMemo {
  const dealTitle = input.deal.name || input.deal.location;
  const title = `Investment Memo — ${dealTitle}`;

  return {
    title,
    summary: buildSummary(input),
    sections: {
      overview: buildOverview(input),
      market: buildMarket(input),
      financials: buildFinancials(input),
      risks: buildRisks(input),
      scenarios: buildScenarios(input),
      recommendation: buildRecommendation(input),
    },
  };
}
