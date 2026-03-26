"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

import MarketSignalsBoard from "@/components/MarketSignalsBoard";
import SectorIntelligencePanel from "@/components/SectorIntelligencePanel";
import { saveUserPrefs, type UserPrefs } from "@/lib/client/userPrefs";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { sectorToBoardRow } from "@/lib/sectors/mappers";
import type { Sector } from "@/lib/sectors/types";
import {
  isTopMover,
  type MarketSectorRow,
} from "@/lib/marketSignalsBoard";

const BTR_SLUG = "build-to-rent";

type MarketMetaPayload = {
  liveSignalCount: number;
  lastRefreshedAt: string;
  avgConfidence: number;
};

type DealBridge = {
  deal: { id: string; name: string; baseIRR: number };
  adjustedIRR: number;
  signalImpact: { irrAdjustment: number; confidence: number } | null;
};

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 20,
        alignItems: "center",
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < step ? "#4ade80" : "#27272a",
            opacity: i < step ? 1 : 0.5,
          }}
        />
      ))}
      <span style={{ fontSize: 11, opacity: 0.45, marginLeft: 8, whiteSpace: "nowrap" }}>
        {step}/{total}
      </span>
    </div>
  );
}

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [meta, setMeta] = useState<MarketMetaPayload | null>(null);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [panelSlug, setPanelSlug] = useState<string | null>(null);
  const [openedSector, setOpenedSector] = useState(false);

  const [sampleDealId, setSampleDealId] = useState<string | null>(null);
  const [bridge, setBridge] = useState<DealBridge | null>(null);
  const [bridgeLoading, setBridgeLoading] = useState(false);

  const [locations, setLocations] = useState("Manchester, Leeds");
  const [dealMin, setDealMin] = useState(10);
  const [dealMax, setDealMax] = useState(80);
  const [pickedSectors, setPickedSectors] = useState<string[]>([BTR_SLUG]);

  const credibility =
    meta != null
      ? `Based on ${meta.liveSignalCount} live signals across planning, capital, and demand · Updated ${formatRelativeTime(meta.lastRefreshedAt)} · Signal confidence ${meta.avgConfidence}%`
      : null;

  useEffect(() => {
    let c = false;
    fetch("/api/sectors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { sectors: Sector[] }) => {
        if (!c) setSectors(d.sectors ?? []);
      })
      .catch(() => {
        if (!c) setSectors([]);
      })
      .finally(() => {
        if (!c) setSectorsLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let c = false;
    fetch("/api/market-meta", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: MarketMetaPayload) => {
        if (!c) setMeta(d);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  const openSector = useCallback((slug: string) => {
    setPanelSlug(slug);
    setOpenedSector(true);
  }, []);

  useEffect(() => {
    if (step !== 4) return;
    let c = false;
    fetch("/api/onboard/sample-deal", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { id: string | null }) => {
        if (!c) setSampleDealId(d.id);
      })
      .catch(() => {
        if (!c) setSampleDealId(null);
      });
    return () => {
      c = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== 4 || !sampleDealId) {
      setBridge(null);
      return;
    }
    let c = false;
    setBridgeLoading(true);
    fetch(`/api/deals/${encodeURIComponent(sampleDealId)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("no deal");
        return r.json() as Promise<DealBridge>;
      })
      .then((d) => {
        if (!c) setBridge(d);
      })
      .catch(() => {
        if (!c) setBridge(null);
      })
      .finally(() => {
        if (!c) setBridgeLoading(false);
      });
    return () => {
      c = true;
    };
  }, [step, sampleDealId]);

  const boardRows: MarketSectorRow[] = sectors.map(sectorToBoardRow);
  const movers = boardRows.filter((r) => isTopMover(r.delta)).slice(0, 2);
  const spotlight =
    movers.length > 0 ? movers : boardRows.slice(0, 2);

  const toggleSectorPick = (slug: string) => {
    setPickedSectors((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const finishPersonalise = () => {
    const prefs: UserPrefs = {
      preferredSectorSlugs: pickedSectors.length ? pickedSectors : [BTR_SLUG],
      targetLocations: locations.trim(),
      dealSizeMinM: dealMin,
      dealSizeMaxM: dealMax,
      onboardedAt: new Date().toISOString(),
    };
    saveUserPrefs(prefs);
    setStep(7);
  };

  const btnPrimary: CSSProperties = {
    padding: "12px 22px",
    borderRadius: 8,
    border: "none",
    background: "#fafafa",
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnGhost: CSSProperties = {
    padding: "12px 18px",
    borderRadius: 8,
    border: "1px solid #3f3f46",
    background: "transparent",
    color: "#e4e4e7",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fafafa",
        minHeight: "100vh",
        padding: "28px 28px 48px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none" }}>
          ← Home
        </Link>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.06em",
            opacity: 0.45,
            textAlign: "right",
            lineHeight: 1.35,
          }}
        >
          PlanSureAI
          <span style={{ display: "block", opacity: 0.8 }}>Market Intelligence · Dev Finance</span>
        </span>
      </div>

      {step > 1 ? <StepBar step={step} total={totalSteps} /> : null}

      {step === 1 ? (
        <section>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "#737373",
              margin: "0 0 12px",
            }}
          >
            REAL-TIME MARKET INTELLIGENCE
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 14px",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            Real-time intelligence for UK development deals
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.5, opacity: 0.88, margin: "0 0 24px" }}>
            See where capital is moving, how planning risk is shifting, and how it impacts your IRR
            — instantly.
          </p>
          <button type="button" style={btnPrimary} onClick={() => setStep(2)}>
            View live market signals
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>
            Live sectors
          </h2>
          <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.5, margin: "0 0 16px" }}>
            Ranked by headline score. Open a row to see drivers, pillars, and geography.
          </p>
          {spotlight.length > 0 ? (
            <p style={{ fontSize: 13, opacity: 0.55, margin: "0 0 16px" }}>
              {movers.length > 0 ? "Large WoW moves: " : "Top of the board: "}
              {spotlight.map((m) => m.name.split(" ")[0] ?? m.name).join(" · ")}
            </p>
          ) : null}
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              style={{ ...btnGhost, marginRight: 10, marginBottom: 10 }}
              onClick={() => openSector(BTR_SLUG)}
            >
              See why Manchester BTR is outperforming →
            </button>
          </div>
          {sectorsLoading ? (
            <p style={{ opacity: 0.6 }}>Loading signals…</p>
          ) : (
            <MarketSignalsBoard
              sectors={boardRows}
              onSectorClick={(id) => openSector(id)}
              credibilityLine={credibility ?? undefined}
            />
          )}
          <SectorIntelligencePanel
            open={panelSlug !== null}
            sectorSlug={panelSlug}
            onClose={() => setPanelSlug(null)}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{
                ...btnPrimary,
                opacity: openedSector ? 1 : 0.45,
                cursor: openedSector ? "pointer" : "not-allowed",
              }}
              disabled={!openedSector}
              onClick={() => openedSector && setStep(3)}
            >
              Continue
            </button>
            <button type="button" style={btnGhost} onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
            This is what feeds deal-level IRR
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.8, margin: "0 0 20px" }}>
            Sector score, drivers, planning / capital / demand pillars, and city-level geo —
            all of it rolls into the signal overlay on your investments.
          </p>
          <button
            type="button"
            style={{ ...btnGhost, marginBottom: 16 }}
            onClick={() => openSector(BTR_SLUG)}
          >
            Re-open BTR intelligence
          </button>
          <SectorIntelligencePanel
            open={panelSlug !== null}
            sectorSlug={panelSlug}
            onClose={() => setPanelSlug(null)}
          />
          <button type="button" style={btnPrimary} onClick={() => setStep(4)}>
            Next: deal impact
          </button>
          <button type="button" style={{ ...btnGhost, marginLeft: 12 }} onClick={() => setStep(2)}>
            Back
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
            Deal impact (live bridge)
          </h2>
          <p style={{ fontSize: 14, opacity: 0.65, margin: "0 0 18px" }}>
            Same signals, applied to a real scheme — base IRR vs signal-adjusted.
          </p>
          {bridgeLoading ? (
            <p style={{ opacity: 0.55 }}>Loading your example deal…</p>
          ) : bridge ? (
            <div
              style={{
                border: "1px solid #3f3f46",
                borderRadius: 12,
                padding: "18px 20px",
                marginBottom: 18,
                background: "#111",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 6 }}>Example from your book</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                {bridge.deal.name}
              </div>
              <div style={{ fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                Base IRR: {bridge.deal.baseIRR.toFixed(1)}%
              </div>
              <div style={{ fontSize: 15, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                Market-adjusted IRR: {bridge.adjustedIRR.toFixed(1)}%
                {bridge.signalImpact ? (
                  <span style={{ color: "#4ade80", marginLeft: 8 }}>
                    (
                    {bridge.signalImpact.irrAdjustment >= 0 ? "+" : ""}
                    {bridge.signalImpact.irrAdjustment.toFixed(1)}% vs base)
                  </span>
                ) : null}
              </div>
              {bridge.signalImpact ? (
                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 10 }}>
                  Signal confidence: {bridge.signalImpact.confidence}%
                </div>
              ) : null}
              <Link
                href={`/?dealId=${encodeURIComponent(bridge.deal.id)}`}
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  fontSize: 14,
                  color: "#a78bfa",
                }}
              >
                Open full analysis on home →
              </Link>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #3f3f46",
                borderRadius: 12,
                padding: "18px 20px",
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                Manchester Build-to-Rent Scheme
              </div>
              <div style={{ fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                Base IRR: 17.0%
              </div>
              <div style={{ fontSize: 15, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                Market-adjusted IRR: 19.7%
                <span style={{ color: "#4ade80", marginLeft: 8 }}>(+2.7% vs base)</span>
              </div>
              <p style={{ fontSize: 13, opacity: 0.55, marginTop: 12, lineHeight: 1.45 }}>
                Illustrative numbers — add a Manchester / BTR deal to your book to see a live bridge,
                or continue to unlock the product.
              </p>
            </div>
          )}
          <button type="button" style={btnPrimary} onClick={() => setStep(5)}>
            Continue
          </button>
          <button type="button" style={{ ...btnGhost, marginLeft: 12 }} onClick={() => setStep(3)}>
            Back
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section
          style={{
            border: "1px solid #52525b",
            borderRadius: 14,
            padding: "26px 22px",
            background: "#0f0f0f",
          }}
        >
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 10px" }}>
            Unlock full deal analysis + live opportunities
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.78, margin: "0 0 22px" }}>
            Portfolio fit scores, ranked pipeline, daily briefing, and branded memos — tuned to
            how you actually deploy.
          </p>
          <button type="button" style={btnPrimary} onClick={() => setStep(6)}>
            Continue
          </button>
          <button type="button" style={{ ...btnGhost, marginLeft: 12 }} onClick={() => setStep(4)}>
            Back
          </button>
        </section>
      ) : null}

      {step === 6 ? (
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
            Personalise (30 seconds)
          </h2>
          <p style={{ fontSize: 14, opacity: 0.6, margin: "0 0 22px" }}>
            Used to weight opportunities, briefing, and alerts — stored only in this browser.
          </p>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>Preferred sectors</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sectors.slice(0, 8).map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggleSectorPick(s.slug)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: pickedSectors.includes(s.slug)
                      ? "1px solid #4ade80"
                      : "1px solid #3f3f46",
                    background: pickedSectors.includes(s.slug) ? "#052e16" : "transparent",
                    color: "#fafafa",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {s.shortCode ?? s.displayTitle ?? s.name}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: "block", marginBottom: 18 }}>
            <span style={{ fontSize: 12, opacity: 0.5 }}>Target locations</span>
            <input
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #3f3f46",
                background: "#141414",
                color: "#fafafa",
                fontSize: 15,
              }}
            />
          </label>
          <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
            <label>
              <span style={{ fontSize: 12, opacity: 0.5 }}>Deal size from (£M GDV)</span>
              <input
                type="number"
                value={dealMin}
                min={1}
                onChange={(e) => setDealMin(Number(e.target.value))}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #3f3f46",
                  background: "#141414",
                  color: "#fafafa",
                  width: 120,
                }}
              />
            </label>
            <label>
              <span style={{ fontSize: 12, opacity: 0.5 }}>to (£M GDV)</span>
              <input
                type="number"
                value={dealMax}
                min={dealMin}
                onChange={(e) => setDealMax(Number(e.target.value))}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #3f3f46",
                  background: "#141414",
                  color: "#fafafa",
                  width: 120,
                }}
              />
            </label>
          </div>
          <button type="button" style={btnPrimary} onClick={finishPersonalise}>
            Save &amp; enter dashboard
          </button>
          <button type="button" style={{ ...btnGhost, marginLeft: 12 }} onClick={() => setStep(5)}>
            Back
          </button>
        </section>
      ) : null}

      {step === 7 ? (
        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 10px" }}>
            You&apos;re in
          </h2>
          <p style={{ fontSize: 15, opacity: 0.72, lineHeight: 1.5, margin: "0 0 24px" }}>
            Start with ranked opportunities, check the briefing, and attach your book on portfolio.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/deals"
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                background: "#14532d",
                color: "#ecfdf5",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Top opportunities (ranked)
            </Link>
            <Link
              href="/portfolio"
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                border: "1px solid #3f3f46",
                color: "#e4e4e7",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Portfolio
            </Link>
            <Link
              href="/briefing"
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                border: "1px solid #3f3f46",
                color: "#fde68a",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Daily briefing
            </Link>
            <Link
              href="/"
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                border: "1px solid #3f3f46",
                color: "#a78bfa",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Full home (maps + site DD)
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
