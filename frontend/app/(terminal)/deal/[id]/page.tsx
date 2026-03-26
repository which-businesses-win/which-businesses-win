"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import DealTerminal from "@/components/deal-terminal/DealTerminal";
import type { DealTerminalModel } from "@/components/deal-terminal/types";
import type { DealSignalImpact } from "@/lib/deals/signalImpact";
import type { DealSensitivityResult } from "@/lib/deals/sensitivity";
type DealApiPayload = {
  deal: {
    name: string;
    location: string;
    sector: string;
    baseIRR: number;
    planningRisk: string;
    decision: string;
  };
  signalImpact: DealSignalImpact | null;
  adjustedIRR: number;
  adjustedStressedIRR: number;
  alert: "upgraded" | "risk" | null;
  sensitivity: DealSensitivityResult | null;
  matchError: string | null;
  message?: string;
};

function toTerminalModel(p: DealApiPayload): DealTerminalModel | null {
  if (!p.signalImpact || p.matchError) return null;
  return {
    deal: {
      name: p.deal.name,
      location: p.deal.location,
      sector: p.deal.sector,
      baseIRR: p.deal.baseIRR,
      planningRisk: p.deal.planningRisk,
      decision: p.deal.decision,
    },
    signalImpact: p.signalImpact,
    adjustedIRR: p.adjustedIRR,
    adjustedStressedIRR: p.adjustedStressedIRR,
    alert: p.alert,
    sensitivity: p.sensitivity,
  };
}

export default function DealDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [model, setModel] = useState<DealTerminalModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing deal id");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/deals/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => {
        if (r.status === 404) throw new Error("Deal not found");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<DealApiPayload>;
      })
      .then((p) => {
        if (cancelled) return;
        const m = toTerminalModel(p);
        if (!m) {
          setError(
            p.message ?? p.matchError ?? "Market Signal unavailable for this deal",
          );
          setModel(null);
        } else {
          setModel(m);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setModel(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((v) => !v)}
          className="mb-6"
        />
      ) : null}
    </div>
  );
}
