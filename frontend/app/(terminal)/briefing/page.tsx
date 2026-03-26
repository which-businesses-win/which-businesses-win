"use client";

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
  const lines = t.split(/\n+/).map((x) => x.trim()).filter(Boolean);
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
      <TerminalScreenTitle title="Daily briefing" kicker="PlanSureAI" />
      {data ? (
        <p className="mb-1 text-sm text-deal-muted">{data.date}</p>
      ) : null}
      {data?.generatedAt ? (
        <p className="mb-8 text-xs tabular-nums text-deal-muted/80">
          Updated {formatHoursAgo(data.generatedAt)}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : data ? (
        <>
          {data.alerts.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
                Live alerts
              </h2>
              <div className="space-y-2">
                {data.alerts.map((a, i) => (
                  <div
                    key={i}
                    className={
                      a.type === "risk"
                        ? "rounded-lg border border-deal-red/40 px-3 py-2 text-sm text-deal-red"
                        : a.type === "upgrade"
                          ? "rounded-lg border border-deal-yellow/50 px-3 py-2 text-sm text-deal-yellow"
                          : "rounded-lg border border-deal-green/40 px-3 py-2 text-sm text-deal-green"
                    }
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
              Top market shift
            </h2>
            <DriverList items={shiftToDrivers(data.topShift)} />
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
              Sector moves
            </h2>
            <DriverList items={data.sectorMoves.map(sectorMoveItem)} />
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
              Top opportunities
            </h2>
            {data.opportunities.length === 0 ? (
              <p className="text-sm text-deal-muted">No pipeline rows.</p>
            ) : (
              <ul className="list-none space-y-4 p-0">
                {data.opportunities.map((o) => (
                  <li key={o.id} className="border-b border-deal-border pb-4 last:border-0">
                    <div className="font-medium text-deal-text">{o.name}</div>
                    <div className="mt-1 text-sm tabular-nums text-deal-green">
                      IRR {o.adjustedIRR.toFixed(1)}%{" "}
                      <span className="text-deal-muted">
                        ({o.irrAdjustment >= 0 ? "+" : ""}
                        {o.irrAdjustment.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-deal-muted">{o.fitLine}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
              Risks to watch
            </h2>
            {data.risks.length === 0 ? (
              <p className="text-sm text-deal-muted">No major flags.</p>
            ) : (
              <DriverList
                items={data.risks.map((r) => ({ type: "neg" as const, text: r }))}
              />
            )}
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
              Suggested actions
            </h2>
            {data.actions.length === 0 ? (
              <p className="text-sm text-deal-muted">No actions yet.</p>
            ) : (
              <DriverList
                items={data.actions.map((a) => ({ type: "pos" as const, text: a }))}
              />
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
