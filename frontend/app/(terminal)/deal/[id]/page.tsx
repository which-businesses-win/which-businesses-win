"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DealTerminal, InvestmentMemoPanel } from "@/components/deal-terminal";
import type { DealTerminalModel } from "@/components/deal-terminal/types";
import type { DealAction, DealDetailMarket } from "@/lib/deals/dealDetailResponse";

type DealApiPayload = {
  deal: {
    id: string;
    name: string;
    location: string;
    sector: string;
    baseIRR: number;
    stressedIRR: number;
    planningRisk: string;
    decision: string;
    market: DealDetailMarket | null;
    actions?: DealAction[];
    units?: number;
    avgUnitSize?: number;
    siteArea?: number;
  };
  matchError: string | null;
  message?: string;
};

function toTerminalModel(p: DealApiPayload): DealTerminalModel | null {
  if (!p.deal.market || p.matchError) return null;
  return {
    deal: {
      name: p.deal.name,
      location: p.deal.location,
      sector: p.deal.sector,
      baseIRR: p.deal.baseIRR,
      stressedIRR: p.deal.stressedIRR,
      planningRisk: p.deal.planningRisk,
      decision: p.deal.decision,
      market: p.deal.market,
      actions: p.deal.actions,
      ...(p.deal.units != null ? { units: p.deal.units } : {}),
      ...(p.deal.avgUnitSize != null
        ? { avgUnitSize: p.deal.avgUnitSize }
        : {}),
      ...(p.deal.siteArea != null ? { siteArea: p.deal.siteArea } : {}),
    },
  };
}

export default function DealDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [payload, setPayload] = useState<DealApiPayload | null>(null);
  const [model, setModel] = useState<DealTerminalModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalsUpdatedAt, setSignalsUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing deal id");
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/deals/${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) => {
        if (r.status === 404) throw new Error("Deal not found");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<DealApiPayload>;
      }),
      fetch("/api/market-meta", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([p, meta]) => {
        if (cancelled) return;
        setPayload(p);
        setModel(toTerminalModel(p));
        setError(null);
        const at =
          meta && typeof meta === "object" && "lastRefreshedAt" in meta
            ? (meta as { lastRefreshedAt?: string | null }).lastRefreshedAt ?? null
            : null;
        setSignalsUpdatedAt(at);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setPayload(null);
          setModel(null);
          setSignalsUpdatedAt(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const dealName = payload?.deal?.name ?? payload?.deal?.location;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/deals"
          className="text-xs font-medium text-deal-muted hover:text-deal-green"
        >
          ← Deals
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-deal-muted">Loading…</p>
      ) : error ? (
        <p className="text-sm text-deal-red">{error}</p>
      ) : model ? (
        <DealTerminal
          data={model}
          signalsUpdatedAt={signalsUpdatedAt}
          className="mb-6"
        />
      ) : payload?.deal ? (
        <div className="mb-6 rounded-xl border border-deal-orange/40 bg-zinc-950/50 px-4 py-4 text-sm text-deal-text">
          <p className="font-semibold text-deal-orange">Market signal unavailable</p>
          <p className="mt-2 text-deal-muted">
            {payload.message ??
              payload.matchError ??
              "Map this deal’s sector to a live sector slug to unlock the Market Signal overlay."}
          </p>
          <p className="mt-3 text-lg font-semibold tabular-nums text-deal-text">
            Base IRR: {payload.deal.baseIRR.toFixed(1)}%
          </p>
        </div>
      ) : null}

      {payload?.deal?.id ? (
        <InvestmentMemoPanel dealId={payload.deal.id} dealName={dealName} />
      ) : null}
    </div>
  );
}
