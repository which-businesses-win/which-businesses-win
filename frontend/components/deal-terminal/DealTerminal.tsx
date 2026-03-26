"use client";

import { tldrDecisionVerb } from "@/lib/marketImpact";
import type { DealTerminalModel } from "./types";

type Props = {
  data: DealTerminalModel;
  detailOpen: boolean;
  onToggleDetail: () => void;
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
  className = "",
}: Props) {
  const { deal, signalImpact: si, adjustedIRR, adjustedStressedIRR, alert } = data;
  const irrDelta = adjustedIRR - deal.baseIRR;
  const up = irrDelta >= 0;
  const verb = tldrDecisionVerb(deal.decision);
  const locLabel = si.canonicalLocation ?? deal.location;

  const driverRows =
    si.driverTape?.length > 0
      ? si.driverTape
      : si.driverHints.map((t) => ({ text: t, sign: "+" as const }));

  return (
    <section
      className={`rounded-xl border border-deal-border bg-deal-bg px-5 py-6 text-deal-text mb-6 ${className}`}
    >
      <h2 className="mb-1 text-[18px] font-bold leading-snug tracking-tight text-deal-text">
        {deal.name}
      </h2>
      <p className="mb-6 text-[11px] font-medium tracking-wide text-deal-muted">
        {deal.location} · {formatSectorDisplay(deal.sector)}
      </p>

      <p className="mb-4 text-base font-semibold tabular-nums text-deal-text">
        Base IRR: {deal.baseIRR}%
      </p>

      {/* Market Signal — integrated block */}
      <div className="mb-6 rounded-r-lg border border-deal-border border-l-2 border-l-deal-green bg-zinc-950/40 px-4 py-4">
        <div className="flex flex-col gap-2">
          <p className="order-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-green md:order-1">
            Market Signal
          </p>
          <p
            className={`order-1 text-2xl font-bold tabular-nums md:order-2 md:text-xl ${
              up ? "text-deal-green" : "text-deal-red"
            }`}
          >
            {up ? "+" : "−"}
            {Math.abs(irrDelta).toFixed(1)}% IRR
          </p>
          <p className="order-3 text-sm leading-snug text-deal-text">
            Market Signal indicates{" "}
            <span
              className={
                up ? "font-semibold text-deal-green" : "font-semibold text-deal-red"
              }
            >
              {si.geoLabel.toLowerCase()}
            </span>{" "}
            locally.
          </p>
          <p
            className={`order-4 text-lg font-extrabold tabular-nums md:text-xl ${
              up ? "text-deal-green" : "text-deal-red"
            }`}
          >
            → Adjusted IRR: {adjustedIRR.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className={verdictClasses(deal.decision)}>→ {verb}</div>

      {alert === "upgraded" ? (
        <p className="mb-3 text-xs font-bold text-deal-green">
          Market Signal +2pp vs typical range
        </p>
      ) : null}
      {alert === "risk" ? (
        <p className="mb-3 text-xs font-bold text-deal-red">
          Market Signal −2pp vs typical range
        </p>
      ) : null}

      <div className="mb-5 border-t border-deal-border pt-5">
        <p className="text-[13px] tabular-nums text-deal-muted">
          Stressed IRR: {adjustedStressedIRR.toFixed(1)}%
        </p>
      </div>

      <p className="mb-5 text-[13px] leading-snug text-deal-muted">
        Planning {deal.planningRisk} ·{" "}
        {si.irrAdjustment >= 0 ? "Market Signal supportive" : "Market Signal a headwind"}
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
          <div className="mb-3 space-y-2 text-sm leading-snug">
            <p>
              <span className="text-deal-muted">Sector: </span>
              <span className="text-deal-text">
                {formatSectorDisplay(deal.sector)} — {si.sectorLabel} ({si.sectorScore})
              </span>
            </p>
            <p>
              <span className="text-deal-muted">Location: </span>
              <span className="text-deal-text">
                {locLabel} — {si.geoLabel} ({Math.round(si.geoScore)})
              </span>
            </p>
          </div>

          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-deal-muted">
            Drivers
          </div>
          <ul className="mb-0 list-none space-y-1.5 p-0 text-sm font-semibold">
            {driverRows.map((row, i) => (
              <li
                key={i}
                className={row.sign === "+" ? "text-deal-green" : "text-deal-red"}
              >
                {row.sign} {row.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
