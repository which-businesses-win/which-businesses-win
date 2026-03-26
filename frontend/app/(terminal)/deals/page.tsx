"use client";

import { useEffect, useState } from "react";

import type { EnrichedDeal } from "@/lib/sourcing/types";
import {
  DealCard,
  DriverList,
  OpportunityRankCard,
  TerminalScreenTitle,
  type DriverItem,
} from "@/components/terminal-ui";
import { opportunityTags } from "@/lib/sourcing/present";
import type { DealMarketCore } from "@/lib/deals/dealDetailResponse";

type BookSummary = {
  id: string;
  name: string;
  location: string;
  sector: string;
  baseIRR: number;
  market: DealMarketCore | null;
};

type ListResponse = {
  count: number;
  opportunities: EnrichedDeal[];
};

type DetailResponse = {
  deal: EnrichedDeal;
  why: string[];
  flags: string[];
};

function upliftFragment(uplift: number): string | null {
  if (Math.abs(uplift) < 0.05) return null;
  const sign = uplift >= 0 ? "+" : "−";
  return `(${sign}${Math.abs(uplift).toFixed(1)}%)`;
}

export default function DealsPage() {
  const [book, setBook] = useState<BookSummary[]>([]);
  const [pipeline, setPipeline] = useState<EnrichedDeal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/deals", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error(`Book HTTP ${r.status}`);
        return r.json() as Promise<{ deals: BookSummary[] }>;
      }),
      fetch("/api/sourcing/opportunities", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error(`Pipeline HTTP ${r.status}`);
        return r.json() as Promise<ListResponse>;
      }),
    ])
      .then(([b, p]) => {
        if (!cancelled) {
          setBook(b.deals ?? []);
          setPipeline(p.opportunities ?? []);
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
        return r.json() as Promise<DetailResponse>;
      })
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const driverItems: DriverItem[] =
    detail?.why.map((t) => ({ type: "pos" as const, text: t })) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <TerminalScreenTitle
        title="Deals"
        kicker="Book · pipeline · opportunities"
      />

      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : err ? (
        <p className="text-sm text-deal-red">{err}</p>
      ) : null}

      {book.length > 0 ? (
        <>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
            Book
          </h2>
          {book.map((d) => {
            const mkt = d.market;
            const adj = mkt?.adjustedIRR ?? d.baseIRR;
            const up = mkt?.uplift ?? 0;
            return (
            <DealCard
              key={d.id}
              name={d.name}
              subtitle={`${d.location} · ${d.sector}`}
              irr={`Market-adjusted IRR: ${adj.toFixed(1)}%`}
              uplift={upliftFragment(up)}
              href={`/deal/${encodeURIComponent(d.id)}`}
            />
          );
          })}
        </>
      ) : null}

      <h2 className="mb-3 mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
        Top opportunities
      </h2>
      {pipeline.length === 0 ? (
        <p className="text-sm text-deal-muted">No pipeline deals yet.</p>
      ) : (
        pipeline.map((d, i) => (
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
        ))
      )}

      {selectedId && detail ? (
        <div className="mb-10 rounded-xl border border-deal-border bg-deal-bg px-4 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-deal-muted">
            Why
          </p>
          <DriverList items={driverItems} />
          {detail.flags.length > 0 ? (
            <ul className="mt-3 list-none space-y-1 p-0 text-sm text-deal-orange">
              {detail.flags.map((f, i) => (
                <li key={i}>⚠️ {f}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
