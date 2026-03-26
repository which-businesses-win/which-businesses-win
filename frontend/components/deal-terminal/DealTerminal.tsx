"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { tldrDecisionVerb } from "@/lib/marketImpact";
import type { DealTerminalModel } from "./types";

type Props = {
  data: DealTerminalModel;
  detailOpen: boolean;
  onToggleDetail: () => void;
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

function verdictClasses(decisionRaw: string): string {
  const d = decisionRaw.trim().toUpperCase();
  const base =
    "flex w-full items-center justify-center px-5 py-3.5 rounded-lg text-base font-extrabold tracking-tight mb-6 sm:inline-flex sm:w-auto sm:justify-start";
  if (d === "PROCEED") {
    return `${base} bg-deal-green text-black border-0`;
  }
  if (d === "CAUTION") {
    return `${base} bg-transparent text-deal-yellow border-2 border-deal-yellow`;
  }
  if (d === "REJECT") {
    return `${base} bg-transparent text-deal-red border-2 border-deal-red`;
  }
  return `${base} bg-zinc-900 text-deal-text border border-deal-border`;
}

export default function DealTerminal({
  data,
  detailOpen,
  onToggleDetail,
  signalsUpdatedAt = null,
  className = "",
}: Props) {
  const { deal } = data;
  const m = deal.market;
  const up = m.uplift >= 0;
  const verb = tldrDecisionVerb(deal.decision);

  return (
    <section
      className={`rounded-xl border border-deal-border bg-deal-bg px-5 py-6 text-deal-text mb-6 ${className}`}
    >
      <h2 className="mb-1 text-[18px] font-bold leading-snug tracking-tight text-deal-text">
        {deal.name}
      </h2>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-deal-muted">
        {deal.location} · {formatSectorDisplay(deal.sector)}
      </p>
      <p className="mb-6 text-[10px] leading-snug text-deal-muted/90">
        Based on live planning, capital and demand signals across the UK
        {signalsUpdatedAt ? (
          <span className="block pt-1 font-medium tabular-nums text-deal-muted">
            Updated {formatRelativeTime(signalsUpdatedAt)}
          </span>
        ) : null}
      </p>

      <div className="mb-6 space-y-0.5 font-semibold tabular-nums text-deal-text">
        <p className="text-base">
          {deal.baseIRR.toFixed(1)}% <span className="text-deal-muted">(base)</span>
        </p>
      </div>

      <div className="mb-6 rounded-r-lg border border-deal-border border-l-2 border-l-deal-green bg-zinc-950/40 px-4 py-4">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-deal-green">
            Market Signal
          </p>
          <p
            className={`text-2xl font-bold tabular-nums md:text-xl ${
              up ? "text-deal-green" : "text-deal-red"
            }`}
          >
            {up ? "+" : "−"}
            {Math.abs(m.uplift).toFixed(1)}%
          </p>
          <p
            className={`text-lg font-extrabold tabular-nums md:text-xl ${
              up ? "text-deal-green" : "text-deal-red"
            }`}
          >
            → {m.adjustedIRR.toFixed(1)}%
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Market-adjusted IRR
          </p>
          <p className="text-[12px] font-medium leading-snug text-deal-muted">
            Driven by current market conditions
          </p>
        </div>
      </div>

      <div className={verdictClasses(deal.decision)}>→ {verb}</div>

      <div className="mb-5 mt-6 border-t border-deal-border pt-5">
        <p className="text-[13px] tabular-nums text-deal-muted">
          Stressed IRR: {m.adjustedStressedIRR.toFixed(1)}%
        </p>
      </div>

      <p className="mb-5 text-[13px] leading-snug text-deal-muted">
        Planning {deal.planningRisk}
      </p>

      <button
        type="button"
        onClick={onToggleDetail}
        className="mb-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-deal-border bg-deal-bg px-3.5 py-3 text-[13px] font-semibold text-deal-text hover:bg-zinc-900/80 sm:w-auto sm:justify-start"
      >
        {`View signal detail ${detailOpen ? "↑" : "↓"}`}
      </button>

      {detailOpen ? (
        <div className="mt-4 border-t border-deal-border pt-5">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-green">
            Market Signal
          </p>
          <div className="mb-3 space-y-2 text-sm leading-snug tabular-nums">
            <p>
              <span className="text-deal-muted">Market position score (sector): </span>
              <span className="text-deal-text">{m.sectorScore}</span>
            </p>
            <p>
              <span className="text-deal-muted">Market position score (location): </span>
              <span className="text-deal-text">{Math.round(m.geoScore)}</span>
            </p>
            <p>
              <span className="text-deal-muted">Signal confidence: </span>
              <span className="text-deal-text">{m.confidence}%</span>
            </p>
          </div>

          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-deal-muted">
            Drivers
          </div>
          <ul className="mb-0 list-none space-y-1.5 p-0 text-sm font-semibold">
            {m.drivers.map((row, i) => (
              <li
                key={i}
                className={row.type === "pos" ? "text-deal-green" : "text-deal-red"}
              >
                {row.type === "pos" ? "+" : "−"} {row.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
