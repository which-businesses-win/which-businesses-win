"use client";

import { useEffect, useState } from "react";

import type { Sector } from "@/lib/sectors/types";
import { SignalRow, TerminalScreenTitle } from "@/components/terminal-ui";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

type MarketMeta = { lastRefreshedAt: string | null };

function sectorLabel(s: Sector): string {
  if (s.rankContext) return s.rankContext;
  if (s.score >= 78) return "Strong Tailwind";
  if (s.score >= 68) return "Favourable";
  if (s.score >= 55) return "Neutral bias";
  return "Watch";
}

function displayName(s: Sector): string {
  return s.displayTitle ?? s.shortCode ?? s.name;
}

export default function MarketPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [meta, setMeta] = useState<MarketMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/sectors", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error(`Sectors HTTP ${r.status}`);
        return r.json() as Promise<{ sectors: Sector[] }>;
      }),
      fetch("/api/market-meta", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([sBody, m]) => {
        if (!cancelled) {
          setSectors(sBody.sectors ?? []);
          setMeta(m as MarketMeta | null);
        }
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

  return (
    <div className="mx-auto max-w-2xl">
      <TerminalScreenTitle title="Market signals — live" kicker="UK development finance" />
      {meta?.lastRefreshedAt ? (
        <p className="mb-6 text-xs tabular-nums text-deal-muted">
          Updated {formatRelativeTime(meta.lastRefreshedAt)}
        </p>
      ) : (
        <p className="mb-6 text-xs text-deal-muted">
          Live sector scores behind Market Signal
        </p>
      )}

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : sectors.length === 0 ? (
        <p className="text-sm text-deal-muted">No sectors yet.</p>
      ) : (
        <div className="mb-10">
          {sectors.map((s) => (
            <SignalRow
              key={s.id}
              name={displayName(s)}
              score={s.score}
              delta={s.delta}
              label={sectorLabel(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
