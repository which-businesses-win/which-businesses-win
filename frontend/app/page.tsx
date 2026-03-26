"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type {
  IngestSignal,
  SiteInsight,
  SiteMetrics,
} from "@/lib/ingest";
import { distanceKm, SITE_RADIUS_KM } from "@/lib/geo";
import type { GeoCoords } from "@/lib/ingest";
import {
  calculateDealSignalImpact,
  findSectorForDeal,
} from "@/lib/deals/signalImpact";
import type { DealAction, DealDetailMarket } from "@/lib/deals/dealDetailResponse";
import type { Insight } from "@/lib/insights";
import type { DealImpact } from "@/lib/impact";
import { sectorToBoardRow } from "@/lib/sectors/mappers";
import type { Sector } from "@/lib/sectors/types";

import { DealTerminal, DealTerminalShowcase } from "@/components/deal-terminal";
import MarketSignalsBoard from "@/components/MarketSignalsBoard";
import SectorIntelligencePanel from "@/components/SectorIntelligencePanel";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
});

function formatIrr(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n > 0 ? "+" : ""}${n}%`;
}

/** Decision block: map site readout → lender-style verdict. */
function verdictFromInsight(level: string): {
  emoji: string;
  label: string;
  color: string;
} {
  if (level.includes("HIGH")) {
    return { emoji: "🟠", label: "CAUTION", color: "#fb923c" };
  }
  if (level.includes("MODERATE")) {
    return { emoji: "🟠", label: "CAUTION", color: "#fbbf24" };
  }
  if (level.includes("LOW")) {
    return { emoji: "🟢", label: "PROCEED", color: "#34d399" };
  }
  if (level.includes("NO NEARBY")) {
    return { emoji: "⚪", label: "REVIEW", color: "#a1a1aa" };
  }
  if (level.includes("SITE NOT LOCATED")) {
    return { emoji: "🟠", label: "CAUTION", color: "#fb923c" };
  }
  return { emoji: "⚪", label: "REVIEW", color: "#a3a3a3" };
}

function formatDealLocation(loc: string): string {
  return loc.trim() ? loc.trim().toUpperCase().replace(/\s+/g, " ") : "";
}

function delayRangeFromSite(
  siteMetrics: SiteMetrics | null,
  level: string,
): string {
  if (!siteMetrics) {
    if (level.includes("HIGH")) return "+3–6 months";
    if (level.includes("MODERATE")) return "+1–3 months";
    if (level.includes("NO NEARBY")) return "Uncertain — limited local data";
    if (level.includes("LOW")) return "Minimal";
    return "—";
  }
  if (level.includes("HIGH") || siteMetrics.riskScore >= 70) {
    return "+3–6 months";
  }
  if (level.includes("MODERATE") || siteMetrics.riskScore >= 50) {
    return "+1–3 months";
  }
  if (level.includes("NO NEARBY")) {
    return "Uncertain — limited local data";
  }
  return "Minimal";
}

function irrImpactRange(impact: DealImpact | null): string {
  if (!impact || impact.irrImpact === 0) return "—";
  const v = impact.irrImpact;
  const upper = v + (v < 0 ? 0.35 : -0.25);
  const lower = v + (v < 0 ? -0.65 : 0.35);
  const hi = Math.max(upper, lower);
  const lo = Math.min(upper, lower);
  return `${formatIrr(hi)} to ${formatIrr(lo)}`;
}

type DealSignalApiPayload = {
  deal: {
    id: string;
    name: string;
    baseIRR: number;
    stressedIRR: number;
    location: string;
    sector: string;
    planningRisk: string;
    decision: string;
    market: DealDetailMarket | null;
    actions?: DealAction[];
  };
  matchError: string | null;
  message?: string;
};

type InvestmentMemoApiResponse = {
  memo: {
    title: string;
    summary: string;
    sections: {
      overview: string;
      market: string;
      financials: string;
      risks: string;
      scenarios: string;
      recommendation: string;
    };
  };
  matchError: string | null;
  alert?: "upgraded" | "risk" | null;
};

function buildMemoPlainText(m: InvestmentMemoApiResponse["memo"]): string {
  const s = m.sections;
  return [
    m.title,
    "",
    "1. Executive summary",
    m.summary,
    "",
    "2. Deal overview",
    s.overview,
    "",
    "3. Market context (signals)",
    s.market,
    "",
    "4. Financials",
    s.financials,
    "",
    "5. Key risks",
    s.risks,
    "",
    "6. Scenario analysis",
    s.scenarios,
    "",
    "7. Recommendation",
    s.recommendation,
  ].join("\n\n");
}

function keyDriverLines(
  impact: DealImpact | null,
  insights: Insight[],
  fallback: string,
): string[] {
  const fromImpact = impact?.drivers?.filter(Boolean) ?? [];
  if (fromImpact.length > 0) {
    return fromImpact.slice(0, 4);
  }
  const fromInsights = insights.map((i) => i.message).filter(Boolean);
  if (fromInsights.length > 0) {
    return fromInsights.slice(0, 4);
  }
  return [fallback];
}

function decisionHeadline(s: IngestSignal) {
  if (s.decisionType === "refusal") return "🔴 Refusal";
  if (s.decisionType === "approval") return "🟢 Approval";
  if (s.decisionType === "appeal") return "🟠 Appeal";
  return "Signal";
}

export default function Home() {
  const [location, setLocation] = useState("leeds");
  const [sector, setSector] = useState("general");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [impact, setImpact] = useState<DealImpact | null>(null);
  const [siteMetrics, setSiteMetrics] = useState<SiteMetrics | null>(null);
  const [siteInsight, setSiteInsight] = useState<SiteInsight | null>(null);
  const [siteCoords, setSiteCoords] = useState<GeoCoords | null>(null);
  const [nearbySignals, setNearbySignals] = useState<IngestSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorPanelSlug, setSectorPanelSlug] = useState<string | null>(null);
  const [marketSectors, setMarketSectors] = useState<Sector[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [dealSignalPayload, setDealSignalPayload] =
    useState<DealSignalApiPayload | null>(null);
  const [dealSignalLoading, setDealSignalLoading] = useState(false);
  const [dealSignalError, setDealSignalError] = useState<string | null>(null);
  const [investmentMemo, setInvestmentMemo] =
    useState<InvestmentMemoApiResponse | null>(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [marketMeta, setMarketMeta] = useState<{
    liveSignalCount: number;
    lastRefreshedAt: string;
    avgConfidence: number;
  } | null>(null);
  const [sampleDealId, setSampleDealId] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    fetch("/api/onboard/sample-deal", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { id: string | null }) => {
        if (!c) setSampleDealId(d.id);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market-meta", { cache: "no-store" })
      .then((r) => r.json())
      .then(
        (d: {
          liveSignalCount: number;
          lastRefreshedAt: string;
          avgConfidence: number;
        }) => {
          if (!cancelled) setMarketMeta(d);
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setInvestmentMemo(null);
    setMemoError(null);
    setPdfLoading(false);
  }, [dealSignalPayload?.deal?.id]);

  useEffect(() => {
    let cancelled = false;
    setSectorsLoading(true);
    fetch("/api/sectors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { sectors: Sector[] }) => {
        if (!cancelled) setMarketSectors(d.sectors ?? []);
      })
      .catch(() => {
        if (!cancelled) setMarketSectors([]);
      })
      .finally(() => {
        if (!cancelled) setSectorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("dealId")
        : null;
    if (!id) {
      setDealSignalPayload(null);
      setDealSignalError(null);
      return;
    }
    let cancelled = false;
    setDealSignalLoading(true);
    setDealSignalError(null);
    fetch(`/api/deals/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((res) => {
        if (res.status === 404) throw new Error("Deal not found");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DealSignalApiPayload>;
      })
      .then((d) => {
        if (!cancelled) setDealSignalPayload(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDealSignalPayload(null);
          setDealSignalError(e instanceof Error ? e.message : "Failed to load deal");
        }
      })
      .finally(() => {
        if (!cancelled) setDealSignalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    const loc = location.trim().toLowerCase();
    if (loc) params.set("location", loc);
    if (sector && sector !== "general") params.set("sector", sector);

    const qs = params.toString();

    setLoading(true);
    setError(null);

    fetch(`/api/ingest${qs ? `?${qs}` : ""}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(
        (data: {
          insights?: Insight[];
          impact?: DealImpact;
          siteMetrics?: SiteMetrics;
          siteInsight?: SiteInsight | null;
          siteCoords?: GeoCoords | null;
          nearbySignals?: IngestSignal[];
        }) => {
          setInsights(data.insights ?? []);
          setImpact(data.impact ?? null);
          setSiteMetrics(data.siteMetrics ?? null);
          setSiteInsight(data.siteInsight ?? null);
          setSiteCoords(data.siteCoords ?? null);
          setNearbySignals(data.nearbySignals ?? []);
        },
      )
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setInsights([]);
        setImpact(null);
        setSiteMetrics(null);
        setSiteInsight(null);
        setSiteCoords(null);
        setNearbySignals([]);
      })
      .finally(() => setLoading(false));
  }, [location, sector]);

  const dealPlace = formatDealLocation(location);
  const dealVerdict = siteInsight ? verdictFromInsight(siteInsight.level) : null;
  const dealDrivers = siteInsight
    ? keyDriverLines(impact, insights, siteInsight.message)
    : [];
  const delayBand = siteInsight
    ? delayRangeFromSite(siteMetrics, siteInsight.level)
    : "—";
  const irrBand = irrImpactRange(impact);

  const liveMarketContext = useMemo(() => {
    if (!location.trim() || sector === "general" || sectorsLoading) return null;
    const s = findSectorForDeal(sector, marketSectors);
    if (!s) return null;
    const m = calculateDealSignalImpact(s, location);
    const short = s.shortCode ?? (s.displayTitle ?? s.name).split(/\s+/)[0] ?? s.name;
    const place = m.canonicalLocation ?? "UK-wide";
    return {
      sectorLine: `${short} — ${m.sectorLabel} (${m.sectorScore})`,
      geoLine: `${place} — ${m.geoLabel} (${Math.round(m.geoScore)})`,
    };
  }, [location, sector, marketSectors, sectorsLoading]);

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fafafa",
        minHeight: "100vh",
        padding: "32px 40px 48px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 20,
          marginBottom: 16,
        }}
      >
        <Link
          href="/deals"
          style={{
            fontSize: 13,
            color: "#4ade80",
            textDecoration: "none",
            opacity: 0.9,
          }}
        >
          Opportunities
        </Link>
        <Link
          href="/portfolio"
          style={{
            fontSize: 13,
            color: "#38bdf8",
            textDecoration: "none",
            opacity: 0.9,
          }}
        >
          Portfolio
        </Link>
        <Link
          href="/briefing"
          style={{
            fontSize: 13,
            color: "#fbbf24",
            textDecoration: "none",
            opacity: 0.9,
          }}
        >
          Briefing
        </Link>
        <Link
          href="/onboard"
          style={{
            fontSize: 13,
            color: "#fafafa",
            textDecoration: "none",
            opacity: 0.95,
            fontWeight: 600,
          }}
        >
          2-min tour
        </Link>
        <Link
          href="/pitch"
          style={{
            fontSize: 13,
            color: "#a78bfa",
            textDecoration: "none",
            opacity: 0.85,
          }}
        >
          Live demo script
        </Link>
        <Link
          href="/objections"
          style={{
            fontSize: 13,
            color: "#e7e5e4",
            textDecoration: "none",
            opacity: 0.9,
          }}
        >
          Lender Q&amp;A
        </Link>
      </div>

      <header style={{ marginBottom: 36 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "#a3a3a3",
            margin: "0 0 10px",
            lineHeight: 1.4,
          }}
        >
          PlanSureAI — Market Intelligence for Development Finance
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 14px",
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
          }}
        >
          Real-time intelligence for UK development deals
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            opacity: 0.88,
            margin: "0 0 22px",
            maxWidth: 560,
          }}
        >
          See where capital is moving, how planning risk is shifting, and how it impacts your IRR
          — instantly.
        </p>
        <div
          style={{
            borderLeft: "2px solid #3f3f46",
            paddingLeft: 14,
            marginBottom: 22,
          }}
        >
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              opacity: 0.78,
              margin: "0 0 4px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Based on {Math.max(47, marketMeta?.liveSignalCount ?? 47)}+ live signals across
            planning, capital and demand
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.78, margin: "0 0 4px" }}>
            Updated every 3 hours
          </p>
          {marketMeta ? (
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                opacity: 0.55,
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Last refreshed {formatRelativeTime(marketMeta.lastRefreshedAt)}
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <a
            href="#market-signals"
            style={{
              display: "inline-block",
              padding: "12px 22px",
              borderRadius: 8,
              background: "#fafafa",
              color: "#0a0a0a",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Live Market Signals
          </a>
          <a
            href="#deal-impact"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 8,
              border: "1px solid #52525b",
              color: "#e4e4e7",
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            See Example Deal Impact
          </a>
        </div>
      </header>

      <section id="market-signals" style={{ scrollMarginTop: 20 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
          }}
        >
          Where the market is moving right now
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            opacity: 0.72,
            margin: "0 0 16px",
            maxWidth: 560,
          }}
        >
          Based on live planning, capital and demand signals across the UK
          {marketMeta?.lastRefreshedAt ? (
            <span style={{ display: "block", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
              Updated {formatRelativeTime(marketMeta.lastRefreshedAt)}
            </span>
          ) : null}
        </p>
        {sectorsLoading ? (
          <p style={{ opacity: 0.65, marginBottom: 24 }}>Loading market signals…</p>
        ) : (
          <MarketSignalsBoard
            sectors={marketSectors.map(sectorToBoardRow)}
            onSectorClick={(slug) => setSectorPanelSlug(slug)}
            omitHeader
          />
        )}
      </section>

      <SectorIntelligencePanel
        open={sectorPanelSlug !== null}
        sectorSlug={sectorPanelSlug}
        onClose={() => setSectorPanelSlug(null)}
      />

      <section id="deal-impact" style={{ scrollMarginTop: 20, marginTop: 8, marginBottom: 36 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 14px",
            letterSpacing: "-0.02em",
          }}
        >
          See the impact on a real deal
        </h2>
        <DealTerminalShowcase />
        <Link
          href={
            sampleDealId
              ? `/deal/${encodeURIComponent(sampleDealId)}`
              : "/onboard"
          }
          style={{
            display: "inline-block",
            marginTop: 18,
            padding: "10px 18px",
            borderRadius: 8,
            background: "#fafafa",
            color: "#0a0a0a",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Open Full Analysis
        </Link>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          Why this matters
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.55, opacity: 0.85, margin: 0, maxWidth: 540 }}>
          Most tools analyse deals in isolation.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.55, opacity: 0.85, margin: "10px 0 0", maxWidth: 540 }}>
          PlanSureAI shows how the market is actively changing them — in real time.
        </p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 14px",
            letterSpacing: "-0.02em",
          }}
        >
          Investment memo preview
        </h2>
        <div
          style={{
            border: "1px solid #27272a",
            borderRadius: 12,
            padding: "18px 20px",
            background: "#0c0c0c",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Investment Memo — Manchester BTR Scheme
          </div>
          <div style={{ opacity: 0.88, marginBottom: 4 }}>Market-adjusted IRR: 19.7%</div>
          <div style={{ opacity: 0.88, marginBottom: 10 }}>Signal confidence: 82%</div>
          <div style={{ opacity: 0.55, marginBottom: 8 }}>Recommendation:</div>
          <div style={{ opacity: 0.9 }}>
            Proceed with acquisition, subject to planning validation.
          </div>
        </div>
        <Link
          href="/onboard"
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #52525b",
            color: "#e4e4e7",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Generate Your Own Memo
        </Link>
      </section>

      <section
        style={{
          marginBottom: 40,
          padding: "22px 20px",
          borderRadius: 12,
          border: "1px solid #3f3f46",
          background: "linear-gradient(165deg, #171717 0%, #0a0a0a 100%)",
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 14px", opacity: 0.95 }}>
          Understand your deals in the context of the live market
        </p>
        <Link
          href="/onboard"
          style={{
            display: "inline-block",
            padding: "12px 22px",
            borderRadius: 8,
            background: "#fafafa",
            color: "#0a0a0a",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Get Access
        </Link>
      </section>

      <section id="site-analysis" style={{ scrollMarginTop: 20, marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "#a1a1aa",
            margin: "0 0 16px",
          }}
        >
          ANALYSE A SITE
        </h2>
        <div
          style={{
            marginBottom: 28,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>Site</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Leeds city centre"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #27272a",
                background: "#141414",
                color: "#fafafa",
                minWidth: 220,
                fontSize: 15,
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>Sector</span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #27272a",
                background: "#141414",
                color: "#fafafa",
                fontSize: 15,
              }}
            >
              <option value="general">General (no sector sleeve)</option>
              <option value="build-to-rent">Build-to-Rent</option>
              <option value="uk-housebuilders">UK Housebuilders</option>
              <option value="high-street-retail">High Street Retail</option>
              <option value="grid-batteries">Grid Batteries</option>
              <option value="small-landlords">Small Landlords</option>
            </select>
          </label>
        </div>
        {liveMarketContext ? (
          <div
            style={{
              marginTop: 4,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid #3f3f46",
              background: "#111",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#a78bfa",
                marginBottom: 10,
              }}
            >
              Market context
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.92 }}>
              {liveMarketContext.sectorLine}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.92, marginTop: 6 }}>
              {liveMarketContext.geoLine}
            </div>
            <p style={{ fontSize: 12, opacity: 0.45, margin: "10px 0 0" }}>
              Live signals
            </p>
          </div>
        ) : null}
      </section>

      {dealSignalLoading ? (
        <p style={{ opacity: 0.55, fontSize: 13, marginBottom: 14 }}>
          Loading live deal / signal bridge…
        </p>
      ) : null}
      {dealSignalError ? (
        <p style={{ color: "#f87171", fontSize: 14, marginBottom: 14 }}>{dealSignalError}</p>
      ) : null}

      {dealSignalPayload?.deal ? (
        <section
          style={{
            border: "1px solid #3f3f46",
            borderRadius: 12,
            padding: "16px 18px 18px",
            background: "linear-gradient(165deg, #141c1a 0%, #0f0f0f 100%)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "#34d399",
              marginBottom: 10,
            }}
          >
            Investment memo
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: investmentMemo ? 14 : 0,
            }}
          >
            <button
              type="button"
              onClick={async () => {
                const id = dealSignalPayload.deal.id;
                setMemoLoading(true);
                setMemoError(null);
                try {
                  const res = await fetch(
                    `/api/deals/${encodeURIComponent(id)}/memo`,
                    { cache: "no-store" },
                  );
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const data = (await res.json()) as InvestmentMemoApiResponse;
                  setInvestmentMemo(data);
                } catch (e: unknown) {
                  setMemoError(e instanceof Error ? e.message : "Memo failed");
                  setInvestmentMemo(null);
                } finally {
                  setMemoLoading(false);
                }
              }}
              disabled={memoLoading || pdfLoading}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #22c55e",
                background: "linear-gradient(180deg, #14532d 0%, #0f5132 100%)",
                color: "#ecfdf5",
                fontSize: 14,
                fontWeight: 600,
                cursor: memoLoading || pdfLoading ? "wait" : "pointer",
                opacity: memoLoading || pdfLoading ? 0.75 : 1,
              }}
            >
              {memoLoading ? "Generating…" : "Generate Investment Memo"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const id = dealSignalPayload.deal.id;
                const raw =
                  dealSignalPayload.deal.name?.trim() ||
                  dealSignalPayload.deal.location ||
                  "memo";
                const safe = raw.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 48);
                setPdfLoading(true);
                setMemoError(null);
                try {
                  const res = await fetch(
                    `/api/deals/${encodeURIComponent(id)}/memo/pdf`,
                    { cache: "no-store" },
                  );
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `PlanSureAI-Memo-${safe || "memo"}.pdf`;
                  a.rel = "noopener";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (e: unknown) {
                  setMemoError(e instanceof Error ? e.message : "PDF failed");
                } finally {
                  setPdfLoading(false);
                }
              }}
              disabled={memoLoading || pdfLoading}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #171717",
                background: "#111",
                color: "#fafafa",
                fontSize: 14,
                fontWeight: 600,
                cursor: memoLoading || pdfLoading ? "wait" : "pointer",
                opacity: memoLoading || pdfLoading ? 0.75 : 1,
              }}
            >
              {pdfLoading ? "Preparing PDF…" : "Download PDF"}
            </button>
            {investmentMemo ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      buildMemoPlainText(investmentMemo.memo),
                    );
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #52525b",
                    background: "#18181b",
                    color: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Copy all
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #52525b",
                    background: "#18181b",
                    color: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Print / PDF
                </button>
              </>
            ) : null}
            {memoError ? (
              <span style={{ color: "#f87171", fontSize: 13 }}>{memoError}</span>
            ) : null}
          </div>

          {investmentMemo ? (
            <div
              id="investment-memo-print"
              style={{
                borderRadius: 10,
                border: "1px solid #27272a",
                background: "#0c0c0c",
                padding: "18px 20px",
                fontSize: 14,
                lineHeight: 1.55,
                color: "#e4e4e7",
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  letterSpacing: "-0.02em",
                  color: "#fafafa",
                }}
              >
                {investmentMemo.memo.title}
              </h2>
              {investmentMemo.matchError ? (
                <p style={{ fontSize: 13, color: "#fb923c", margin: "0 0 16px" }}>
                  Sector signals not applied — memo uses static fields until sector mapping
                  succeeds.
                </p>
              ) : null}

              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "#a1a1aa",
                  margin: "0 0 8px",
                }}
              >
                1. Executive summary
              </h3>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  margin: "0 0 20px",
                  fontSize: 14,
                  opacity: 0.95,
                }}
              >
                {investmentMemo.memo.summary}
              </pre>

              {(
                [
                  ["2. Deal overview", investmentMemo.memo.sections.overview],
                  ["3. Market context (signals)", investmentMemo.memo.sections.market],
                  ["4. Financial impact", investmentMemo.memo.sections.financials],
                  ["5. Key risks", investmentMemo.memo.sections.risks],
                  ["6. Scenario analysis", investmentMemo.memo.sections.scenarios],
                  ["7. Recommendation", investmentMemo.memo.sections.recommendation],
                ] as const
              ).map(([label, body]) => (
                <div key={label} style={{ marginBottom: 18 }}>
                  <h3
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      color: "#a1a1aa",
                      margin: "0 0 8px",
                    }}
                  >
                    {label}
                  </h3>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      margin: 0,
                      fontSize: 14,
                      opacity: 0.92,
                    }}
                  >
                    {body}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, opacity: 0.55, margin: 0, lineHeight: 1.5 }}>
              One-click IC-style brief: deal facts, live signals, scenarios, risks, and a clear
              recommendation — assembled from data already in the system (no essay model).
            </p>
          )}
        </section>
      ) : null}

      {dealSignalPayload?.deal?.market ? (
        <DealTerminal
          data={{
            deal: {
              name: dealSignalPayload.deal.name,
              location: dealSignalPayload.deal.location,
              sector: dealSignalPayload.deal.sector,
              baseIRR: dealSignalPayload.deal.baseIRR,
              stressedIRR: dealSignalPayload.deal.stressedIRR,
              planningRisk: dealSignalPayload.deal.planningRisk,
              decision: dealSignalPayload.deal.decision,
              market: dealSignalPayload.deal.market,
              actions: dealSignalPayload.deal.actions,
            },
          }}
        />
      ) : dealSignalPayload?.matchError ? (
        <p style={{ opacity: 0.65, fontSize: 14, marginBottom: 20 }}>
          {dealSignalPayload.message ??
            "Could not match sector — Market Signal needs a mapped sector."}
        </p>
      ) : null}

      {loading ? (
        <p style={{ opacity: 0.65, marginBottom: 30 }}>Loading deal view…</p>
      ) : error ? (
        <p style={{ color: "#f87171", marginBottom: 30 }}>{error}</p>
      ) : null}

      {!loading && !error ? (
        <div style={{ marginBottom: 32 }}>
          {!location.trim() ? (
            <>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: "0 0 12px",
                  letterSpacing: "-0.02em",
                }}
              >
                Deal view
              </h1>
              <div style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.5 }}>
                Enter a UK site above — you’ll get a verdict, expected delay/IRR impact, and
                drivers, with evidence below.
              </div>
            </>
          ) : siteInsight && dealVerdict ? (
            <section
              style={{
                border: "1px solid #3f3f46",
                borderRadius: 12,
                padding: "20px 20px 22px",
                background: "linear-gradient(165deg, #171717 0%, #0f0f0f 100%)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "#a1a1aa",
                  marginBottom: 10,
                }}
              >
                DEAL VIEW — {dealPlace}
                {dealPlace.toLowerCase() === "leeds" ? " (EXAMPLE)" : ""}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: dealVerdict.color,
                  marginBottom: 10,
                  letterSpacing: "-0.02em",
                }}
              >
                {dealVerdict.emoji} {dealVerdict.label}
              </div>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.5,
                  margin: "0 0 18px",
                  opacity: 0.92,
                }}
              >
                {siteInsight.message}
              </p>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "#a1a1aa",
                  marginBottom: 8,
                }}
              >
                Expected impact
              </div>
              <ul
                style={{
                  margin: "0 0 18px",
                  paddingLeft: 18,
                  fontSize: 15,
                  lineHeight: 1.55,
                  opacity: 0.9,
                }}
              >
                <li>Delay: {delayBand}</li>
                <li>
                  IRR impact:{" "}
                  <span
                    style={{
                      color:
                        (impact?.irrImpact ?? 0) >= 0 ? "#34d399" : "#f87171",
                    }}
                  >
                    {irrBand}
                  </span>{" "}
                  <span style={{ opacity: 0.55, fontSize: 13 }}>
                    (model band from signals)
                  </span>
                </li>
              </ul>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "#a1a1aa",
                  marginBottom: 8,
                }}
              >
                Key drivers
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 14,
                  lineHeight: 1.55,
                  opacity: 0.88,
                }}
              >
                {dealDrivers.map((line, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {line}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 12, opacity: 0.5, margin: "14px 0 0", lineHeight: 1.45 }}>
                Based on nearby planning activity and market signals · {siteInsight.action}
              </p>
            </section>
          ) : (
            <p style={{ opacity: 0.7 }}>No site readout yet.</p>
          )}
        </div>
      ) : null}

      {!loading && !error && location.trim() ? (
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.12em",
            opacity: 0.45,
            margin: "0 0 16px",
          }}
        >
          Supporting data
        </h2>
      ) : null}

      {!loading && !error && location.trim() && insights.length > 0 ? (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", opacity: 0.55, margin: "0 0 12px" }}>
            Signal feed
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {insights.map((i, idx) => (
              <div
                key={idx}
                style={{
                  padding: 14,
                  border: "1px solid #27272a",
                  borderRadius: 10,
                  background: "#0f0f0f",
                }}
              >
                <strong style={{ fontSize: 12, letterSpacing: "0.04em" }}>
                  {i.type.toUpperCase()}
                </strong>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.45 }}>{i.message}</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>→ {i.action}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !error && location.trim() ? (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", opacity: 0.55, margin: "0 0 12px" }}>
            Nearby activity
          </h2>
          {nearbySignals.length === 0 ? (
            <p style={{ opacity: 0.65, fontSize: 14 }}>
              {siteCoords
                ? `Nothing within ${SITE_RADIUS_KM} km with a geocoded location this run.`
                : "Geocode the site to see pins and distances."}
            </p>
          ) : (
            nearbySignals.map((s, i) => {
              const km =
                siteCoords && s.coords
                  ? distanceKm(siteCoords, s.coords).toFixed(1)
                  : "—";
              return (
                <div key={`${s.link ?? s.title}-${i}`} style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: 14 }}>{decisionHeadline(s)}</strong>
                  <div style={{ marginTop: 4, fontSize: 15, lineHeight: 1.4 }}>
                    {s.link ? (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#e4e4e7" }}
                      >
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    {km} km away · Signal strength {s.score}
                  </div>
                </div>
              );
            })
          )}
        </section>
      ) : null}

      {!loading && !error && siteCoords ? (
        <section style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", opacity: 0.55, margin: "0 0 12px" }}>
            Map
          </h2>
          <p style={{ fontSize: 13, opacity: 0.55, marginBottom: 12 }}>
            Site (blue), {SITE_RADIUS_KM} km ring, signals by decision.
          </p>
          <MapView site={siteCoords} signals={nearbySignals} />
        </section>
      ) : null}

      {siteMetrics && siteInsight && siteInsight.level !== "SITE NOT LOCATED" ? (
        <p style={{ fontSize: 12, opacity: 0.45, marginTop: 16 }}>
          {siteMetrics.total} applications in radius · refusal rate{" "}
          {Math.round(siteMetrics.refusalRate * 100)}% · risk score {siteMetrics.riskScore}
        </p>
      ) : null}
    </main>
  );
}
