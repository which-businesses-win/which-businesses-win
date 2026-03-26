import { calculateDealSignalImpact, findSectorForDeal } from "@/lib/deals/signalImpact";
import type { PortfolioPayload } from "@/lib/portfolio/types";
import { opportunityTags } from "@/lib/sourcing/present";
import type { EnrichedDeal } from "@/lib/sourcing/types";
import type { Sector } from "@/lib/sectors/types";

export type BriefingAlertType = "opportunity" | "risk" | "upgrade";

export type BriefingAlert = {
  type: BriefingAlertType;
  message: string;
};

export type BriefingOpportunity = {
  id: string;
  name: string;
  location: string;
  sector: string;
  adjustedIRR: number;
  irrAdjustment: number;
  overallScore: number;
  headlineLabel: string;
  /** One-line subtitle for scanners, e.g. "Strong Tailwind · High fit" */
  fitLine: string;
};

export type BriefingPayload = {
  date: string;
  generatedAt: string;
  topShift: string;
  sectorMoves: string[];
  opportunities: BriefingOpportunity[];
  risks: string[];
  actions: string[];
  alerts: BriefingAlert[];
};

function sectorLabel(s: Sector): string {
  return s.shortCode ?? s.displayTitle ?? s.name;
}

function longSectorName(s: Sector): string {
  return s.displayTitle ?? s.name;
}

function fitTier(fitScore: number): string {
  if (fitScore >= 65) return "High fit";
  if (fitScore >= 45) return "Moderate fit";
  return "Low fit";
}

function trimReason(s: string, max = 52): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function moveReason(sector: Sector, up: boolean): string {
  const d = sector.drivers.find((x) =>
    up ? x.type === "positive" : x.type === "negative",
  );
  if (d) return trimReason(d.title);
  const ch = sector.changes.find((c) => (up ? c.impact >= 0 : c.impact < 0));
  if (ch) return trimReason(ch.text);
  return up ? "Momentum positive on pillars" : "Headline softening";
}

function buildTopShift(sectors: Sector[]): string {
  const tracked = sectors.filter((s) => s.delta != null && s.delta !== 0);
  if (tracked.length === 0) {
    const lead = [...sectors].sort((a, b) => b.score - a.score)[0];
    if (!lead) {
      return "No sector data yet — run signal ingestion to populate the briefing.";
    }
    const hint =
      lead.drivers[0]?.title ??
      lead.changes[0]?.text ??
      "See live sector board for positioning.";
    return `${longSectorName(lead)} leads the screen at ${Math.round(lead.score)} — ${trimReason(hint, 90)}.`;
  }
  const s = [...tracked].sort(
    (a, b) => Math.abs(b.delta!) - Math.abs(a.delta!),
  )[0]!;
  const d = s.delta!;
  const label = longSectorName(s);
  const driver =
    s.drivers[0]?.title ??
    s.changes[0]?.text ??
    "Review capital, planning, and demand pillars for detail.";
  if (d > 0) {
    return `${label} strengthening\n\nScore increased to ${Math.round(s.score)} (+${d}) — driven by ${trimReason(driver, 90)}.`;
  }
  return `${label} softening\n\nScore at ${Math.round(s.score)} (${d}) — ${trimReason(driver, 90)}.`;
}

function buildSectorMoves(sectors: Sector[]): string[] {
  const tracked = sectors.filter((s) => s.delta != null && s.delta !== 0);
  if (tracked.length === 0) {
    return [
      "No WoW headline deltas on file — momentum lines appear once sector history is tracked.",
    ];
  }
  const up = tracked
    .filter((s) => s.delta! > 0)
    .sort((a, b) => b.delta! - a.delta!)
    .slice(0, 4);
  const down = tracked
    .filter((s) => s.delta! < 0)
    .sort((a, b) => a.delta! - b.delta!)
    .slice(0, 4);

  const lines: string[] = [];
  for (const s of up) {
    lines.push(
      `↑ ${sectorLabel(s)}: +${s.delta} (${moveReason(s, true)})`,
    );
  }
  for (const s of down) {
    lines.push(
      `↓ ${sectorLabel(s)}: ${s.delta} (${moveReason(s, false)})`,
    );
  }
  return lines.length ? lines : ["Headline scores unchanged WoW across mapped sectors."];
}

function buildRisks(sectors: Sector[], portfolio: PortfolioPayload): string[] {
  const out: string[] = [];
  for (const s of sectors) {
    for (const dr of s.drivers.filter((x) => x.type === "negative")) {
      out.push(`${sectorLabel(s)}: ${trimReason(dr.title, 72)}`);
    }
  }
  const avgPlan =
    sectors.length > 0
      ? sectors.reduce((acc, s) => acc + s.signals.planning.score, 0) /
        sectors.length
      : 50;
  if (avgPlan < 44) {
    out.push("Planning conditions softening on average — consent timelines may stretch.");
  }
  const avgDel =
    sectors.length > 0
      ? sectors.reduce((acc, s) => acc + s.signals.delivery.score, 0) /
        sectors.length
      : 50;
  if (avgDel < 44) {
    out.push("Build cost / delivery pressure elevated vs neutral across sectors.");
  }
  for (const f of portfolio.flags.slice(0, 3)) {
    out.push(`${f.message} (${f.detail})`);
  }
  for (const c of sectors.flatMap((s) =>
    s.changes.filter((x) => x.impact < -1).map((x) => ({ s, x })),
  ).slice(0, 4)) {
    out.push(`Watch: ${trimReason(c.x.text, 68)}`);
  }
  if (portfolio.sensitivity.highDownside) {
    out.push(
      "Bear book IRR sits materially below base — stress funding and planning paths.",
    );
  }
  const seen = new Set<string>();
  return out.filter((x) => {
    if (seen.has(x)) return false;
    seen.add(x);
    return true;
  }).slice(0, 8);
}

function buildActions(
  sectors: Sector[],
  portfolio: PortfolioPayload,
  opportunities: EnrichedDeal[],
): string[] {
  const actions: string[] = [];
  for (const r of portfolio.rebalancing.slice(0, 4)) {
    actions.push(r.startsWith("→") ? r : `→ ${r}`);
  }
  const bestUp = sectors
    .filter((s) => s.delta != null && s.delta > 2)
    .sort((a, b) => b.delta! - a.delta!)[0];
  if (bestUp) {
    actions.push(
      `→ Increase exposure to ${sectorLabel(bestUp)} if thesis aligns — headline momentum positive.`,
    );
  }
  const worstDown = sectors
    .filter((s) => s.delta != null && s.delta < -3)
    .sort((a, b) => a.delta! - b.delta!)[0];
  if (worstDown) {
    actions.push(
      `→ Tighten underwriting on ${sectorLabel(worstDown)} — headline deteriorating.`,
    );
  }
  const top = opportunities[0];
  if (top && opportunities.length > 0) {
    actions.push(
      `→ Review "${top.name}" (${top.location}) — top-ranked opportunity vs current book.`,
    );
  }
  const thin = Object.entries(portfolio.metrics.exposureBySector).filter(
    ([, v]) => v > 0 && v < 0.12,
  );
  if (thin.length) {
    actions.push(
      `→ Consider diversifying: ${thin.slice(0, 2).map(([k]) => k).join(", ")} sleeves are thin.`,
    );
  }
  const seen = new Set<string>();
  return actions.filter((x) => {
    if (seen.has(x)) return false;
    seen.add(x);
    return true;
  }).slice(0, 8);
}

function buildAlerts(
  sectors: Sector[],
  opportunities: EnrichedDeal[],
  bookRows: { id: string; name: string | null; location: string; sector: string }[],
): BriefingAlert[] {
  const alerts: BriefingAlert[] = [];

  for (const o of opportunities.filter((x) => x.overallScore >= 85).slice(0, 3)) {
    alerts.push({
      type: "opportunity",
      message: `High-conviction opportunity: ${o.name} (score ${Math.round(o.overallScore)})`,
    });
  }
  for (const s of sectors) {
    if (s.delta != null && s.delta <= -10) {
      alerts.push({
        type: "risk",
        message: `Market deterioration: ${longSectorName(s)} headline ${s.delta} WoW`,
      });
    }
  }
  for (const row of bookRows) {
    const sec = findSectorForDeal(row.sector, sectors);
    if (!sec) continue;
    const adj = calculateDealSignalImpact(sec, row.location).irrAdjustment;
    if (adj > 2) {
      const label = row.name?.trim() || row.location;
      alerts.push({
        type: "upgrade",
        message: `Deal upgraded by conditions: ${label} (+${adj.toFixed(1)}pp IRR vs base signal overlay)`,
      });
    }
  }
  const seen = new Set<string>();
  return alerts.filter((a) => {
    if (seen.has(a.message)) return false;
    seen.add(a.message);
    return true;
  }).slice(0, 10);
}

function toBriefingOpportunities(rows: EnrichedDeal[]): BriefingOpportunity[] {
  return rows.slice(0, 5).map((o) => {
    const tags = opportunityTags(o);
    const fitLine =
      tags.length > 0 ? tags.join(" · ") : `${o.headlineLabel} · ${fitTier(o.fitScore)}`;
    return {
      id: o.id,
      name: o.name,
      location: o.location,
      sector: o.sector,
      adjustedIRR: o.adjustedIRR,
      irrAdjustment: o.irrAdjustment,
      overallScore: o.overallScore,
      headlineLabel: o.headlineLabel,
      fitLine,
    };
  });
}

export type BriefingBuildInput = {
  sectors: Sector[];
  portfolio: PortfolioPayload;
  opportunities: EnrichedDeal[];
  bookRows: { id: string; name: string | null; location: string; sector: string }[];
};

export function generateBriefing(input: BriefingBuildInput): BriefingPayload {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const generatedAt = now.toISOString();

  return {
    date,
    generatedAt,
    topShift: buildTopShift(input.sectors),
    sectorMoves: buildSectorMoves(input.sectors),
    opportunities: toBriefingOpportunities(input.opportunities),
    risks: buildRisks(input.sectors, input.portfolio),
    actions: buildActions(input.sectors, input.portfolio, input.opportunities),
    alerts: buildAlerts(input.sectors, input.opportunities, input.bookRows),
  };
}
