"use client";

import { useId, useMemo, useState } from "react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getSignalLabel } from "@/lib/marketSignalsBoard";
import { tldrDecisionVerb } from "@/lib/marketImpact";
import type { DealMarketDriver } from "@/lib/deals/dealDetailResponse";
import type { DealTerminalModel } from "./types";

type Props = {
  data: DealTerminalModel;
  /** When signals were last recomputed (from `GET /api/market-meta`). */
  signalsUpdatedAt?: string | null;
  className?: string;
};

function formatSectorDisplay(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatPlanningRisk(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function verdictClasses(decisionRaw: string): string {
  const d = decisionRaw.trim().toUpperCase();
  const base =
    "inline-flex w-full min-h-[48px] items-center justify-center rounded-xl px-5 py-3 text-[16px] font-semibold tracking-tight md:min-h-0 md:w-auto md:rounded-lg md:py-2.5 md:text-[15px]";
  if (d === "PROCEED") {
    return `${base} bg-deal-green text-black active:opacity-90`;
  }
  if (d === "CAUTION") {
    return `${base} border-2 border-deal-yellow bg-transparent text-deal-yellow`;
  }
  if (d === "REJECT") {
    return `${base} border-2 border-deal-red bg-transparent text-deal-red`;
  }
  return `${base} border border-deal-border bg-zinc-900 text-deal-text`;
}

function scenarioMarkerPct(
  bear: number,
  base: number,
  bull: number,
): number {
  const span = bull - bear;
  if (!Number.isFinite(span) || span <= 0) return 50;
  return Math.min(100, Math.max(0, ((base - bear) / span) * 100));
}

function sortDriversForDisplay(drivers: DealMarketDriver[]): DealMarketDriver[] {
  return [...drivers].sort(
    (a, b) => Math.abs(b.impact ?? 0) - Math.abs(a.impact ?? 0),
  );
}

export default function DealTerminal({
  data,
  signalsUpdatedAt = null,
  className = "",
}: Props) {
  const detailId = useId();
  const [signalDetailOpen, setSignalDetailOpen] = useState(false);
  const { deal } = data;
  const m = deal.market;
  const up = m.uplift >= 0;
  const verb = tldrDecisionVerb(deal.decision);
  const upliftStr = `${up ? "+" : "−"}${Math.abs(m.uplift).toFixed(1)}%`;
  const sec = m.scores.sector;
  const geo = m.scores.geo;
  const sectorBand = getSignalLabel(sec).label;
  const geoBand = getSignalLabel(Math.round(geo)).label;
  const scen = m.scenarios ?? null;
  const markerPct =
    scen != null
      ? scenarioMarkerPct(scen.bear, scen.base, scen.bull)
      : 50;

  const driversOrdered = useMemo(() => sortDriversForDisplay(m.drivers), [m.drivers]);

  return (
    <section
      className={`mb-6 rounded-xl border border-deal-border bg-deal-bg p-4 text-deal-text sm:p-6 ${className}`}
    >
      <h2 className="mb-1 text-[17px] font-bold leading-snug tracking-tight">
        {deal.name}
      </h2>
      <p className="mb-0 text-[11px] font-medium tracking-wide text-deal-muted">
        {deal.location} · {formatSectorDisplay(deal.sector)}
        {signalsUpdatedAt ? (
          <span className="ml-2 tabular-nums opacity-80">
            · Updated {formatRelativeTime(signalsUpdatedAt)}
          </span>
        ) : null}
      </p>

      {/* Labels: ignorable — numbers do the trust work */}
      <div className="mt-8 space-y-5 md:mt-10 md:space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-3xl font-medium tabular-nums tracking-tight text-deal-text/70">
            {deal.baseIRR.toFixed(1)}%
          </span>
          <span className="max-w-[6.5rem] shrink-0 text-right text-[10px] leading-tight tracking-tighter text-deal-muted/40">
            base
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span
            className={`text-3xl font-bold tabular-nums tracking-tight ${
              up ? "text-deal-green" : "text-deal-red"
            }`}
          >
            {upliftStr}
          </span>
          <span className="max-w-[6.5rem] shrink-0 text-right text-[10px] leading-tight tracking-tighter text-deal-muted/35">
            market impact
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span
            className={`inline-flex items-baseline gap-0.5 text-3xl font-semibold tabular-nums tracking-tight ${
              up ? "text-deal-green" : "text-deal-red"
            }`}
          >
            <span className="text-deal-muted/70" aria-hidden>
              →
            </span>
            {m.adjustedIRR.toFixed(1)}%
          </span>
          <span className="max-w-[6.5rem] shrink-0 text-right text-[10px] leading-tight tracking-tighter text-deal-muted/40">
            adjusted
          </span>
        </div>
      </div>

      {/* Justifies the uplift — terminal density, not doc spacing */}
      <div className="mt-10 space-y-1.5 text-[13px] font-semibold leading-snug md:mt-12">
        <p className="mb-1 text-[10px] font-medium tracking-tighter text-deal-muted/55">
          Market signals:
        </p>
        {driversOrdered.map((row, i) => (
          <div
            key={i}
            className={row.type === "pos" ? "text-deal-green" : "text-deal-red"}
          >
            {row.type === "pos" ? "↑ " : "↓ "}
            {row.text}
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] tabular-nums text-deal-muted/45 md:mt-6">
        Confidence: {m.confidence}%
      </p>

      <div className="mt-8 md:mt-10">
        <div className={verdictClasses(deal.decision)}>→ {verb}</div>
      </div>

      <button
        type="button"
        className="mt-6 mb-6 flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-deal-border bg-transparent py-2.5 text-sm font-semibold text-deal-green transition-colors hover:bg-zinc-900/60 active:bg-zinc-900"
        aria-expanded={signalDetailOpen}
        aria-controls={detailId}
        onClick={() => setSignalDetailOpen((o) => !o)}
      >
        {signalDetailOpen ? "Hide sector detail" : "View sector detail"}
        <span
          className={`inline-block transition-transform ${signalDetailOpen ? "rotate-180" : ""}`}
          aria-hidden
        >
          ↓
        </span>
      </button>

      <div
        id={detailId}
        role="region"
        aria-label="Sector and location scores"
        hidden={!signalDetailOpen}
        className="mb-6 rounded-xl border border-deal-border bg-zinc-950/30 p-3 text-sm sm:p-4"
      >
        <div className="space-y-2.5">
          <p>
            <span className="text-deal-muted">Sector: </span>
            <span className="text-deal-text">
              {formatSectorDisplay(deal.sector)} — {sectorBand} ({sec})
            </span>
          </p>
          <p>
            <span className="text-deal-muted">Location: </span>
            <span className="text-deal-text">
              {deal.location} — {geoBand} ({Math.round(geo)})
            </span>
          </p>
        </div>
      </div>

      {m.riskNote ? (
        <div className="mb-6 border-t border-deal-border pt-5 text-sm font-semibold text-deal-orange sm:pt-6">
          ⚠️ {m.riskNote}
        </div>
      ) : null}

      {scen ? (
        <div className="mb-6 border-t border-deal-border pt-5 sm:pt-6">
          <p className="mb-2 text-xs text-deal-muted sm:mb-3 sm:text-sm">Sensitivity</p>
          <div className="space-y-1 text-sm font-semibold tabular-nums">
            <div className="text-deal-green-hi">
              {scen.bull.toFixed(1)}% — Bull
            </div>
            <div className="text-deal-text">{scen.base.toFixed(1)}% — Base</div>
            <div className="text-deal-red">{scen.bear.toFixed(1)}% — Bear</div>
          </div>

          <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-deal-border">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-deal-red" />
            <div className="absolute left-1/3 top-0 h-full w-1/3 bg-deal-text" />
            <div className="absolute left-2/3 top-0 h-full w-1/3 bg-deal-green" />
            <div
              className="absolute top-1/2 z-10 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-deal-text shadow-sm"
              style={{ left: `${markerPct}%` }}
              title={`Base scenario ${scen.base.toFixed(1)}%`}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-deal-muted tabular-nums">
            <span>{scen.bear.toFixed(1)}%</span>
            <span>{scen.base.toFixed(1)}%</span>
            <span>{scen.bull.toFixed(1)}%</span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-deal-border pt-5 text-xs tabular-nums text-deal-muted sm:pt-6">
        <span>Stressed {m.adjustedStressedIRR.toFixed(1)}%</span>
        <span>Planning · {formatPlanningRisk(deal.planningRisk)}</span>
      </div>
    </section>
  );
}
