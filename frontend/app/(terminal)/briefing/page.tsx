"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { BriefingPayload } from "@/lib/briefing/generateBriefing";
import { DriverList, TerminalScreenTitle, type DriverItem } from "@/components/terminal-ui";

function formatHoursAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "just now";
  if (h === 1) return "1 hour ago";
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

function shiftToDrivers(topShift: string): DriverItem[] {
  const t = topShift.trim();
  if (!t) return [];
  const lines = t
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (lines.length <= 1) {
    return [{ type: "pos", text: t.replace(/\s+/g, " ") }];
  }
  return lines.map((line) =>
    line.startsWith("−") || line.startsWith("-")
      ? ({ type: "neg" as const, text: line.replace(/^−|-\s*/, "") })
      : ({ type: "pos" as const, text: line.replace(/^\++\s*/, "") }),
  );
}

function sectorMoveItem(line: string): DriverItem {
  if (line.startsWith("↓")) return { type: "neg", text: line.replace(/^↓\s*/, "") };
  if (line.startsWith("↑")) return { type: "pos", text: line.replace(/^↑\s*/, "") };
  return { type: "pos", text: line };
}

export default function BriefingPage() {
  const [data, setData] = useState<BriefingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/briefing/today", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BriefingPayload>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <TerminalScreenTitle kicker="Today" title="Briefing" />
      <p className="-mt-4 mb-6 text-xs font-medium tracking-wide text-deal-muted">
        What changed · what matters · what to do
      </p>

      {data ? (
        <p className="mb-1 text-lg font-semibold tabular-nums text-deal-text">{data.date}</p>
      ) : null}
      {data?.generatedAt ? (
        <p className="mb-10 text-xs tabular-nums text-deal-muted/90">
          Generated {formatHoursAgo(data.generatedAt)} · refresh for latest signals
        </p>
      ) : (
        <div className="mb-10" />
      )}

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : data ? (
        <div className="space-y-10">
          {data.alerts.length > 0 ? (
            <section>
              <h2 className="mb-3 border-b border-deal-border pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
                Live alerts
              </h2>
              <div className="space-y-2">
                {data.alerts.map((a, i) => (
                  <div
                    key={i}
                    className={
                      a.type === "risk"
                        ? "rounded-lg border border-deal-red/35 bg-deal-red/5 px-3 py-2.5 text-sm text-deal-red"
                        : a.type === "upgrade"
                          ? "rounded-lg border border-deal-yellow/45 bg-deal-yellow/5 px-3 py-2.5 text-sm text-deal-yellow"
                          : "rounded-lg border border-deal-green/35 bg-deal-green/5 px-3 py-2.5 text-sm text-deal-green"
                    }
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 border-b border-deal-border pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
              Top market shift
            </h2>
            <DriverList items={shiftToDrivers(data.topShift)} />
          </section>

          <section>
            <h2 className="mb-3 border-b border-deal-border pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
              Sector moves
            </h2>
            <DriverList items={data.sectorMoves.map(sectorMoveItem)} />
          </section>

          <section>
            <h2 className="mb-3 border-b border-deal-border pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
              Top opportunities
            </h2>
            {data.opportunities.length === 0 ? (
              <p className="text-sm text-deal-muted">
                No pipeline deals — add{" "}
                <code className="text-deal-green">SourcedDeal</code> rows or check{" "}
                <Link href="/opportunities" className="text-deal-green hover:underline">
                  Opportunities
                </Link>
                .
              </p>
            ) : (
              <ol className="list-none space-y-5 p-0">
                {data.opportunities.map((o, i) => (
                  <li
                    key={o.id}
                    className="flex gap-3 border-b border-deal-border/60 pb-5 last:border-0"
                  >
                    <span className="w-6 shrink-0 text-sm font-bold tabular-nums text-deal-muted">
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-deal-text">{o.name}</div>
                      <div className="mt-1 text-sm tabular-nums text-deal-green">
                        IRR {o.adjustedIRR.toFixed(1)}%
                        {Math.abs(o.irrAdjustment) >= 0.05 ? (
                          <span className="text-deal-muted">
                            {" "}
                            ({o.irrAdjustment >= 0 ? "+" : ""}
                            {o.irrAdjustment.toFixed(1)}%)
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-deal-muted">{o.fitLine}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h2 className="mb-3 border-b border-deal-border pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
              Risks to watch
            </h2>
            {data.risks.length === 0 ? (
              <p className="text-sm text-deal-muted">No major flags.</p>
            ) : (
              <ul className="list-none space-y-1.5 p-0 text-sm text-deal-red">
                {data.risks.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-bold">−</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 border-b border-deal-border pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
              Suggested actions
            </h2>
            {data.actions.length === 0 ? (
              <p className="text-sm text-deal-muted">No actions yet.</p>
            ) : (
              <ul className="list-none space-y-2 p-0 text-sm font-medium text-deal-text">
                {data.actions.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 text-deal-green">→</span>
                    <span>{a.replace(/^\s*→\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="border-t border-deal-border pt-6 text-xs text-deal-muted">
            Full pipeline ranking:{" "}
            <Link href="/opportunities" className="font-medium text-deal-green hover:underline">
              Opportunities
            </Link>
            {" · "}
            Book:{" "}
            <Link href="/deals" className="font-medium text-deal-green hover:underline">
              Deals
            </Link>
            {" · "}
            Exposure:{" "}
            <Link href="/portfolio" className="font-medium text-deal-green hover:underline">
              Portfolio
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
