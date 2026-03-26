"use client";

import { useId, useMemo, useState } from "react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getSignalLabel } from "@/lib/marketSignalsBoard";
import { label } from "@/lib/actions";
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

/** Strongest first within polarity; order polarities to match uplift direction */
function sortDriversForUplift(
  drivers: DealMarketDriver[],
  upliftNonNegative: boolean,
): DealMarketDriver[] {
  const byMag = (a: DealMarketDriver, b: DealMarketDriver) =>
    Math.abs(b.impact ?? 0) - Math.abs(a.impact ?? 0);
  const pos = drivers.filter((d) => d.type === "pos").sort(byMag);
  const neg = drivers.filter((d) => d.type === "neg").sort(byMag);
  return upliftNonNegative ? [...pos, ...neg] : [...neg, ...pos];
}

/** Mix ↑ / + for positives, − for negatives — reads analytical, not decorative */
function driverPrefix(posIndex: number, type: "pos" | "neg"): string {
  if (type === "neg") return "− ";
  return posIndex % 2 === 0 ? "↑ " : "+ ";
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
  const primaryAction = deal.actions?.[0];
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

  const driversOrdered = useMemo(
    () => sortDriversForUplift(m.drivers, m.uplift >= 0),
    [m.drivers, m.uplift],
  );

  const signalLines = useMemo(() => {
    let posRank = 0;
    return driversOrdered.map((row, i) => {
      const prefix = driverPrefix(
        row.type === "pos" ? posRank++ : 0,
        row.type,
      );
      return (
        <div
          key={i}
          className={
            row.type === "pos"
              ? "text-deal-text"
              : "text-deal-text/65"
          }
        >
          {prefix}
          {row.text}
        </div>
      );
    });
  }, [driversOrdered]);

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

      {/* Neutral numerics — meaning from ±, →, and drivers (not retail green/red) */}
      <div className="mt-8 space-y-5 md:mt-10 md:space-y-6">
        <p className="text-3xl font-medium tabular-nums tracking-tight text-deal-text/50">
          {deal.baseIRR.toFixed(1)}%
        </p>
        <p className="text-3xl font-medium tabular-nums tracking-tight text-deal-text/75">
          {upliftStr}
        </p>
        <p className="inline-flex items-baseline gap-0.5 text-3xl font-semibold tabular-nums tracking-tight text-deal-text">
          <span className="text-deal-muted/55" aria-hidden>
            →
          </span>
          {m.adjustedIRR.toFixed(1)}%
        </p>
      </div>

      <span className="sr-only">Market signals</span>
      <div className="mt-10 space-y-1 text-[13px] font-semibold leading-tight md:mt-12">
        {signalLines}
      </div>

      <p className="mt-5 text-[11px] tabular-nums text-deal-muted/45 md:mt-6">
        Confidence: {m.confidence}%
      </p>

      {primaryAction ? (
        <div className="mt-3 space-y-1">
          <div className="text-sm text-deal-text">→ {primaryAction.text}</div>
          <div className="text-xs tabular-nums text-deal-muted/60">
            +{primaryAction.impact.toFixed(1)}% IRR · {label(primaryAction.confidence)}
          </div>
        </div>
      ) : null}

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
