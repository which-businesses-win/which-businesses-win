"use client";

import { useEffect, useState } from "react";

import type { EnrichedDeal } from "@/lib/sourcing/types";
import { opportunityTags } from "@/lib/sourcing/present";
import { OpportunityRankCard, TerminalScreenTitle } from "@/components/terminal-ui";

type ListResponse = {
  count: number;
  opportunities: EnrichedDeal[];
};

type DetailResponse = {
  deal: EnrichedDeal;
  why: string[];
  flags: string[];
};

function upliftFragment(irrAdjustment: number): string | null {
  if (Math.abs(irrAdjustment) < 0.05) return null;
  const sign = irrAdjustment >= 0 ? "+" : "−";
  return `(${sign}${Math.abs(irrAdjustment).toFixed(1)}%)`;
}

export default function OpportunitiesPage() {
  const [pipeline, setPipeline] = useState<EnrichedDeal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sourcing/opportunities", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ListResponse>;
      })
      .then((p) => {
        if (!cancelled) setPipeline(p.opportunities ?? []);
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

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/sourcing/deals/${encodeURIComponent(selectedId)}`, {
      cache: "no-store",
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<DetailResponse & { error?: string }>;
      })
      .then((d) => {
        if (!cancelled && !("error" in d && d.error)) setDetail(d as DetailResponse);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div className="mx-auto max-w-2xl">
      <TerminalScreenTitle
        title="Top opportunities"
        kicker="Live sourcing · ranked by IRR, fit & risk"
      />

      <p className="mb-8 text-sm leading-relaxed text-deal-muted">
        New deals are scored against your book and live signals: rankings shift as data
        refreshes.
      </p>

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : null}

      {!loading && !err && pipeline.length === 0 ? (
        <div className="rounded-xl border border-deal-border bg-zinc-950/40 px-4 py-6 text-sm text-deal-muted">
          <p className="mb-2 font-medium text-deal-text">No pipeline deals yet</p>
          <p>
            Add rows to <code className="text-deal-green">SourcedDeal</code> (listings,
            planning-led schemes, internal pipeline). They appear here ranked automatically.
          </p>
        </div>
      ) : null}

      <div className="space-y-0">
        {pipeline.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="block w-full cursor-pointer text-left"
            onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
          >
            <OpportunityRankCard
              rank={i + 1}
              name={d.name}
              subtitle={`${d.location} · ${d.sector}`}
              score={d.overallScore}
              irrLine={`Market-adjusted IRR: ${d.adjustedIRR.toFixed(1)}%`}
              uplift={upliftFragment(d.irrAdjustment)}
              tags={opportunityTags(d)}
              selected={selectedId === d.id}
            />
          </button>
        ))}
      </div>

      {selectedId && detail ? (
        <div className="mb-10 rounded-xl border border-deal-border bg-deal-bg px-4 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-deal-muted">
            Why this ranks highly
          </p>
          <ul className="list-none space-y-2 p-0 text-sm leading-snug text-deal-text">
            {detail.why.map((line, i) => (
              <li key={i}>→ {line}</li>
            ))}
          </ul>
          {detail.flags.length > 0 ? (
            <ul className="mt-3 list-none space-y-1 p-0 text-sm text-deal-orange">
              {detail.flags.map((f, i) => (
                <li key={i}>⚠️ {f}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="mt-8 text-xs text-deal-muted">
        Book deals live under <span className="text-deal-text">Deals</span> — this feed is
        for new opportunities only.
      </p>
    </div>
  );
}
