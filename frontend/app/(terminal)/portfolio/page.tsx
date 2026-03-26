"use client";

import { useEffect, useMemo, useState } from "react";

import type { PortfolioPayload } from "@/lib/portfolio/types";
import {
  MetricHero,
  RiskFlag,
  ScenarioBlock,
  TerminalScreenTitle,
} from "@/components/terminal-ui";

function formatGdvM(millions: number): string {
  if (!Number.isFinite(millions) || millions <= 0) return "—";
  if (millions >= 100) return `£${millions.toFixed(0)}M`;
  return `£${millions.toFixed(1)}M`;
}

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
        {Math.abs(delta).toFixed(1)}pp vs base
      </>
    );

  const topDeals = useMemo(() => {
    if (!data?.deals?.length) return [];
    return [...data.deals]
      .sort((a, b) => b.gdv - a.gdv)
      .slice(0, 8);
  }, [data?.deals]);

  return (
    <div className="mx-auto max-w-2xl">
      <TerminalScreenTitle
        title="Portfolio intelligence"
        kicker="Exposure · risk · allocation"
      />

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : data && m ? (
        <>
          <MetricHero
            value={`${m.adjustedIRR.toFixed(1)}%`}
            label="Portfolio IRR (market-adjusted)"
            delta={deltaNode}
            className="mb-6"
          />

          <div className="mb-10 space-y-2 border-b border-deal-border pb-8 text-sm text-deal-text">
            <p className="tabular-nums">
              <span className="text-deal-muted">Base IRR </span>
              <span className="font-semibold">{m.avgIRR.toFixed(1)}%</span>
            </p>
            <p className="tabular-nums">
              <span className="text-deal-muted">Total GDV </span>
              <span className="font-semibold">{formatGdvM(m.totalGDV)}</span>
            </p>
            <p className="tabular-nums text-deal-muted">
              Signal lift on capital{" "}
              <span className={delta >= 0 ? "text-deal-green" : "text-deal-red"}>
                {delta >= 0 ? "+" : "−"}
                {Math.abs(delta).toFixed(1)}pp
              </span>
            </p>
            <p className="text-xs text-deal-muted">
              Concentration risk score: {m.riskScore}/100
            </p>
          </div>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Sector exposure
          </h2>
          <div className="mb-10">
            {sectorEntries.length === 0 ? (
              <p className="text-sm text-deal-muted">No sector split.</p>
            ) : (
              sectorEntries.map(([label, pct]) => (
                <ExposureRow key={label} label={label} pct={pct} />
              ))
            )}
          </div>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Geographic exposure
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
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
                Risk
              </h2>
              {data.flags.map((f, i) => (
                <RiskFlag key={i} text={`${f.message} — ${f.detail}`} />
              ))}
            </div>
          ) : null}

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Portfolio sensitivity
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
              text={`High downside exposure (−${data.sensitivity.downsideVsBasePp.toFixed(1)}pp base − bear)`}
              className="mb-10"
            />
          ) : (
            <p className="mb-10 text-xs text-deal-muted">
              Downside spread base − bear:{" "}
              {data.sensitivity.downsideVsBasePp.toFixed(1)}pp
            </p>
          )}

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Market conditions impact
          </h2>
          <p className="mb-1 text-lg font-semibold tabular-nums text-deal-green">
            {data.marketImpact.avgIrrAdjustment >= 0 ? "+" : ""}
            {data.marketImpact.avgIrrAdjustment.toFixed(1)}% IRR uplift (GDV-weighted)
          </p>
          <p className="mb-2 text-xs text-deal-muted">Across deployed capital</p>
          <ul className="mb-10 list-none space-y-1 p-0 text-sm text-deal-text">
            {data.marketImpact.lines.map((line, i) => (
              <li key={i}>→ {line}</li>
            ))}
          </ul>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Suggested rebalancing
          </h2>
          <ul className="mb-10 list-none space-y-2 p-0 text-sm text-deal-text">
            {data.rebalancing.map((line, i) => (
              <li key={i}>→ {line}</li>
            ))}
          </ul>

          {topDeals.length > 0 ? (
            <>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
                Largest positions
              </h2>
              <div className="overflow-x-auto rounded-lg border border-deal-border bg-zinc-950/30">
                <table className="w-full text-left text-xs text-deal-text">
                  <thead>
                    <tr className="border-b border-deal-border text-deal-muted">
                      <th className="px-3 py-2 font-semibold">Deal</th>
                      <th className="px-3 py-2 font-semibold">GDV</th>
                      <th className="px-3 py-2 font-semibold">Base</th>
                      <th className="px-3 py-2 font-semibold">Mkt-adj.</th>
                      <th className="px-3 py-2 font-semibold">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDeals.map((d) => (
                      <tr key={d.id} className="border-b border-deal-border/60 last:border-0">
                        <td className="max-w-[140px] truncate px-3 py-2 font-medium">
                          {d.name}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{formatGdvM(d.gdv)}</td>
                        <td className="px-3 py-2 tabular-nums">{d.baseIRR.toFixed(1)}%</td>
                        <td className="px-3 py-2 tabular-nums">{d.adjustedIRR.toFixed(1)}%</td>
                        <td
                          className={`px-3 py-2 tabular-nums ${
                            d.uplift >= 0 ? "text-deal-green" : "text-deal-red"
                          }`}
                        >
                          {d.uplift >= 0 ? "+" : ""}
                          {d.uplift.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
