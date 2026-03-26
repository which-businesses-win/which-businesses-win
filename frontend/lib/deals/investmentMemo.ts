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
  const place = deal.location.trim() || "UK";
  const sectorName = input.sector
    ? sectorHeadlineName(input.sector)
    : deal.sector;
  const pr = planningRiskTone(deal.planningRisk);
  const prShort =
    pr === "high"
      ? "Elevated planning risk — consent path needs explicit diligence."
      : pr === "low"
        ? "Planning risk appears contained vs typical UK schemes."
        : "Moderate planning risk.";

  if (!signalImpact) {
    const p2 = `Base IRR ${deal.baseIRR.toFixed(1)}% — no live signal overlay (${matchError?.replace(/_/g, " ") ?? "sector not mapped"}).`;
    return [
      `${sectorName} — ${place}.`,
      p2,
      `${prShort} Underwrite on base case until signals attach.`,
    ].join("\n\n");
  }

  const irrAdj = signalImpact.irrAdjustment;
  const drivers =
    signalImpact.driverHints.slice(0, 2).join("; ") ||
    "sector and location momentum.";
  const align =
    irrAdj >= 0.5
      ? "Strong alignment with current market conditions."
      : irrAdj <= -0.5
        ? "Market overlay is negative vs base — returns rely on execution and cost control."
        : "Neutral vs headline market conditions.";

  let tail = "";
  if (portfolio && portfolio.sectorExposurePct > 40) {
    tail = ` Book ~${Math.round(portfolio.sectorExposurePct)}% ${portfolio.sectorLabel} by GDV — concentration is material.`;
  } else if (
    portfolio &&
    portfolio.sectorExposurePct < 12 &&
    portfolio.totalGDV > 0
  ) {
    tail = ` ${portfolio.sectorLabel} is a thin sleeve — additive if strategy fits.`;
  }

  return [
    `High-conviction ${sectorName} opportunity — ${place}.`,
    `Market-adjusted IRR ${adjustedIRR.toFixed(1)}% (${irrAdj >= 0 ? "+" : ""}${irrAdj.toFixed(1)}pp from signals), driven by ${drivers.toLowerCase()}.`,
    `${prShort} ${align}${tail}`,
  ].join("\n\n");
}

function buildOverview(input: MemoGenerationInput): string {
  const d = input.deal;
  const sectorDisplay = input.sector
    ? sectorHeadlineName(input.sector)
    : d.sector;
  const lines = [
    `Location: ${d.location.trim() || "—"}`,
    `Sector: ${sectorDisplay}`,
    `GDV: ${fmtMoneyM(d.gdv)}`,
    "",
    `Base IRR: ${d.baseIRR.toFixed(1)}%`,
    input.signalImpact
      ? `Market-adjusted IRR: ${input.adjustedIRR.toFixed(1)}%`
      : `Market-adjusted IRR: — (signals not applied)`,
    `Stressed IRR: ${input.adjustedStressedIRR.toFixed(1)}%`,
    `Planning risk: ${d.planningRisk}`,
    `Decision flag: ${d.decision}`,
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

  const city =
    si.canonicalLocation && si.canonicalLocation !== "UK"
      ? si.canonicalLocation
      : input.deal.location.trim() || "UK-wide";
  const short = sector.shortCode ?? sectorHeadlineName(sector).split(/\s+/)[0] ?? sector.name;

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
    `Sector (${short}): ${si.sectorLabel} (${Math.round(si.sectorScore)})`,
    `Location (${city}): ${si.geoLabel} (${Math.round(si.geoScore)})`,
    "",
    "Key drivers:",
    ...drivers,
    "",
    "Recent changes:",
    ...(changeLines.length
      ? changeLines
      : ["No recent change events recorded for this sector."]),
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
    `Signal-driven IRR uplift: ${adj >= 0 ? "+" : ""}${adj.toFixed(1)}pp`,
    "",
    "Primary drivers:",
    `→ ${si.geoLabel} local conditions`,
    `→ Sector momentum (${si.sectorLabel})`,
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
    `Bull Case: ${bull.irr.toFixed(1)}%`,
    `Base Case: ${base.irr.toFixed(1)}%`,
    `Bear Case: ${bear.irr.toFixed(1)}%`,
    "",
    "Downside driven by planning friction and capital tightening when bear assumptions bind.",
  ].join("\n");
}

function buildRecommendation(input: MemoGenerationInput): string {
  const verb = recommendationVerb(input);
  const pr = planningRiskTone(input.deal.planningRisk);
  const si = input.signalImpact;

  let lead =
    verb === "proceed"
      ? "Proceed with acquisition, subject to planning validation and legal sign-off."
      : verb === "caution"
        ? "Proceed only with explicit planning and funding mitigations — set clear IC kill criteria."
        : "Do not advance without revised underwriting or clearer signals.";

  if (verb === "proceed" && pr === "high") {
    lead =
      "Proceed only after planning milestones are de-risked — file risk elevated vs typical book.";
  }

  const align =
    si && si.irrAdjustment >= 0
      ? "Strong alignment with current market signals and portfolio positioning."
      : si && si.irrAdjustment < 0
        ? "Market overlay is negative — returns rely on execution and margin protection."
        : "Confirm base case before IC without relying on signal uplift.";

  const tail: string[] = [align];
  if (input.portfolio && input.portfolio.sectorExposurePct > 40) {
    tail.push(
      `Consider limiting further ${input.portfolio.sectorLabel} exposure beyond this deal until the sleeve is rebalanced.`,
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
