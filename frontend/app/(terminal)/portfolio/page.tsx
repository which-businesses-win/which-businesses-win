"use client";

import { useEffect, useState } from "react";

import type { PortfolioPayload } from "@/lib/portfolio/types";
import {
  MetricHero,
  RiskFlag,
  ScenarioBlock,
  TerminalScreenTitle,
} from "@/components/terminal-ui";

function ExposureRow({ label, pct }: { label: string; pct: number }) {
  const w = Math.min(100, Math.round(pct * 100));
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm text-deal-text">
        <span>{label}</span>
        <span className="tabular-nums text-deal-muted">{w}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-deal-border">
        <div
          className="h-full rounded-full bg-deal-green"
          style={{ width: `${w}%`, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolio", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PortfolioPayload>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const m = data?.metrics;
  const delta = m != null ? m.adjustedIRR - m.avgIRR : 0;
  const sectorEntries = m
    ? Object.entries(m.exposureBySector).sort((a, b) => b[1] - a[1])
    : [];
  const locEntries = m
    ? Object.entries(m.exposureByLocation).sort((a, b) => b[1] - a[1])
    : [];

  const deltaNode =
    m == null ? undefined : (
      <>
        {delta >= 0 ? "↑" : "↓"} {delta >= 0 ? "+" : "−"}
        {Math.abs(delta).toFixed(1)}% vs base
      </>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <TerminalScreenTitle title="Portfolio positioning" kicker="Exposure + Market Signal" />

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : data && m ? (
        <>
          <MetricHero
            value={`${m.adjustedIRR.toFixed(1)}%`}
            label="Market-adjusted IRR (GDV-weighted)"
            delta={deltaNode}
            className="mb-10"
          />
          <p className="mb-10 text-sm text-deal-muted">
            Base IRR {m.avgIRR.toFixed(1)}% · Market adding{" "}
            <span className={delta >= 0 ? "text-deal-green" : "text-deal-red"}>
              {delta >= 0 ? "+" : "−"}
              {Math.abs(delta).toFixed(1)}%
            </span>
          </p>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Exposure
          </h2>
          <div className="mb-10">
            {sectorEntries.length === 0 ? (
              <p className="text-sm text-deal-muted">No sector split.</p>
            ) : (
              sectorEntries.map(([label, pct]) => (
                <ExposureRow key={label} label={label} pct={pct} />
              ))
            )}
            {sectorEntries[0] && sectorEntries[0][1] >= 0.4 ? (
              <RiskFlag
                text={`High exposure to ${sectorEntries[0][0]}`}
                className="mt-2"
              />
            ) : null}
          </div>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Geography
          </h2>
          <div className="mb-10">
            {locEntries.length === 0 ? (
              <p className="text-sm text-deal-muted">No location split.</p>
            ) : (
              locEntries.map(([label, pct]) => (
                <ExposureRow key={label} label={label} pct={pct} />
              ))
            )}
          </div>

          {data.flags.length > 0 ? (
            <div className="mb-10 space-y-2">
              {data.flags.map((f, i) => (
                <RiskFlag key={i} text={`${f.message} (${f.detail})`} />
              ))}
            </div>
          ) : null}

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Market sensitivity
          </h2>
          <ScenarioBlock
            className="mb-3"
            rows={[
              {
                label: "Bull",
                value: `${data.sensitivity.bullIRR.toFixed(1)}%`,
                tone: "bull",
              },
              {
                label: "Base",
                value: `${data.sensitivity.baseIRR.toFixed(1)}%`,
                tone: "base",
              },
              {
                label: "Bear",
                value: `${data.sensitivity.bearIRR.toFixed(1)}%`,
                tone: "bear",
              },
            ]}
          />
          {data.sensitivity.highDownside ? (
            <RiskFlag
              text={`High downside: base − bear ${data.sensitivity.downsideVsBasePp.toFixed(1)}pp`}
              className="mb-10"
            />
          ) : null}

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Market Signal (mean adjustment)
          </h2>
          <p className="mb-2 text-lg font-semibold tabular-nums text-deal-green">
            {data.marketImpact.avgIrrAdjustment >= 0 ? "+" : ""}
            {data.marketImpact.avgIrrAdjustment.toFixed(1)}%
          </p>
          <ul className="mb-10 list-none space-y-1 p-0 text-sm text-deal-muted">
            {data.marketImpact.lines.map((line, i) => (
              <li key={i}>→ {line}</li>
            ))}
          </ul>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Suggested actions
          </h2>
          <ul className="list-none space-y-2 p-0 text-sm text-deal-text">
            {data.rebalancing.map((line, i) => (
              <li key={i}>→ {line}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
