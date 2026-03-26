"use client";

import { useEffect, useState } from "react";

import { getSignalLabel } from "@/lib/marketSignalsBoard";
import type { Sector, SignalBreakdown } from "@/lib/sectors/types";

function formatDelta(delta: number | null): string {
  if (delta === null) return "↑ +?";
  if (delta > 0) return `↑ +${delta}`;
  if (delta < 0) return `↓ ${delta}`;
  return "→ 0";
}

const LABEL_COLORS: Record<
  ReturnType<typeof getSignalLabel>["color"],
  string
> = {
  green: "#4ade80",
  "green-light": "#86efac",
  grey: "#a1a1aa",
  orange: "#fb923c",
  red: "#f87171",
};

function tierFromRank(rank: number): string {
  if (rank <= 2) return "Top 20% of tracked sectors";
  if (rank <= 5) return "Top half of tracked sectors";
  return "Tracked sector";
}

const PILLAR_LABELS: { key: keyof SignalBreakdown; label: string }[] = [
  { key: "planning", label: "Planning Environment" },
  { key: "capital", label: "Capital Availability" },
  { key: "demand", label: "Demand Strength" },
  { key: "regulation", label: "Regulatory Risk" },
  { key: "delivery", label: "Delivery Risk" },
];

function metricArrow(delta: number): string {
  if (delta >= 3) return "↑↑";
  if (delta > 0) return "↑";
  if (delta < 0) return "↓";
  return "→";
}

/** Momentum vs last persisted geo snapshot for this city. */
function geoDeltaGlyph(delta: number | null): string {
  if (delta === null) return "→";
  if (delta > 2) return "↑";
  if (delta < -2) return "↓";
  return "→";
}

function shortWhen(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1w ago";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type Props = {
  open: boolean;
  sectorSlug: string | null;
  onClose: () => void;
};

export default function SectorIntelligencePanel({
  open,
  sectorSlug,
  onClose,
}: Props) {
  const [mobile, setMobile] = useState(true);
  const [sector, setSector] = useState<Sector | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open || !sectorSlug) {
      setSector(null);
      setFetchError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/sectors/${encodeURIComponent(sectorSlug)}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Sector>;
      })
      .then((data) => {
        if (!cancelled) setSector(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSector(null);
          setFetchError(e instanceof Error ? e.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, sectorSlug]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !sectorSlug) return null;

  const signal = sector ? getSignalLabel(sector.score) : null;
  const labelColor = signal ? LABEL_COLORS[signal.color] : "#a1a1aa";

  const panelInner = (
    <div
      style={{
        background: "#0a0a0a",
        color: "#fafafa",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid #27272a",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>
            Sector positioning
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            {loading
              ? "…"
              : sector
                ? sector.shortCode
                  ? `${sector.displayTitle ?? sector.name} (${sector.shortCode})`
                  : sector.displayTitle ?? sector.name
                : "—"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid #3f3f46",
            background: "#141414",
            color: "#fafafa",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "18px 18px 28px" }}>
        {fetchError ? (
          <p style={{ color: "#f87171", fontSize: 14 }}>{fetchError}</p>
        ) : loading ? (
          <p style={{ opacity: 0.6, fontSize: 14 }}>Loading…</p>
        ) : sector ? (
          <>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #3f3f46",
                background: "#111",
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>
                <span style={{ opacity: 0.65 }}>Market position score: </span>
                <strong style={{ color: "#e4e4e7" }}>{sector.score}</strong>
                <span style={{ opacity: 0.45 }}> — </span>
                <span style={{ fontWeight: 600, color: labelColor }}>
                  {signal?.label}
                </span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>
                <span style={{ opacity: 0.65 }}>Signal confidence: </span>
                <strong style={{ color: "#a78bfa", opacity: 1 }}>
                  {sector.confidence}%
                </strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.55, lineHeight: 1.45 }}>
                {tierFromRank(sector.rank)} · {formatDelta(sector.delta)} WoW
              </div>
              <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.45, marginTop: 6 }}>
                Based on live planning, capital and demand signals across the UK ·{" "}
                {sector.signalCount ?? "—"} data points in this sleeve
              </div>
            </div>

            <SectionTitle titleCase>What&apos;s driving this</SectionTitle>
            <ul
              style={{
                margin: "0 0 18px",
                paddingLeft: 18,
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              {sector.drivers.map((dr, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <span style={{ color: dr.type === "positive" ? "#4ade80" : "#f87171" }}>
                    {dr.type === "positive" ? "+ " : "− "}
                  </span>
                  {dr.title}
                  <span style={{ opacity: 0.4, fontSize: 12, marginLeft: 6 }}>
                    ({dr.impact > 0 ? "+" : ""}
                    {dr.impact})
                  </span>
                </li>
              ))}
            </ul>

            <SectionTitle>Signal breakdown</SectionTitle>
            <div
              style={{
                display: "grid",
                gap: 8,
                marginBottom: 22,
                fontSize: 14,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {PILLAR_LABELS.map(({ key, label }) => {
                const m = sector.signals[key];
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "#141414",
                      border: "1px solid #27272a",
                    }}
                  >
                    <span style={{ opacity: 0.9 }}>{label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{m.score}</span>
                      <span style={{ opacity: 0.75, minWidth: 28 }}>
                        {metricArrow(m.delta)}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <SectionTitle titleCase>Geographic Strength</SectionTitle>
            <p style={{ fontSize: 12, opacity: 0.45, margin: "0 0 10px" }}>
              UK cities — headline score by location (vs last snapshot when tracked)
            </p>
            <div
              style={{
                display: "grid",
                gap: 8,
                marginBottom: 22,
                fontSize: 14,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sector.geoScores.map((g) => (
                <div
                  key={g.location}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#141414",
                    border: "1px solid #27272a",
                  }}
                >
                  <span style={{ opacity: 0.9 }}>{g.location}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{g.score}</span>
                    <span style={{ opacity: 0.85, minWidth: 22 }}>
                      {geoDeltaGlyph(g.delta)}
                    </span>
                    <span style={{ opacity: 0.65, fontSize: 13, maxWidth: 140, textAlign: "right" }}>
                      {g.label}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <SectionTitle>Strategic moves</SectionTitle>
            <p style={{ fontSize: 12, opacity: 0.45, margin: "0 0 10px" }}>
              Recommended positioning
            </p>
            <ul
              style={{
                margin: "0 0 22px",
                paddingLeft: 18,
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              {sector.strategy.map((line, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  → {line}
                </li>
              ))}
            </ul>

            <SectionTitle>Latest changes</SectionTitle>
            <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none", fontSize: 14 }}>
              {sector.changes.map((c, i) => (
                <li
                  key={c.id}
                  style={{
                    marginBottom: 10,
                    paddingBottom: 10,
                    borderBottom:
                      i < sector.changes.length - 1 ? "1px solid #27272a" : "none",
                    lineHeight: 1.45,
                  }}
                >
                  <span style={{ color: c.impact >= 0 ? "#4ade80" : "#f87171" }}>
                    {c.impact >= 0 ? "+ " : "− "}
                  </span>
                  {c.text}
                  <span style={{ opacity: 0.45, fontSize: 12, marginLeft: 8 }}>
                    ({shortWhen(c.date)})
                  </span>
                </li>
              ))}
            </ul>

            <SectionTitle>Deal implications</SectionTitle>
            <p style={{ fontSize: 12, opacity: 0.45, margin: "0 0 10px" }}>
              PlanSureAI — bridge to live underwriting
            </p>
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid #3f3f46",
                background: "#0f0f0f",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <div>
                <span style={{ opacity: 0.55 }}>IRR uplift potential: </span>
                <strong>
                  {sector.dealImpact.irrDeltaMin > 0 ? "+" : ""}
                  {sector.dealImpact.irrDeltaMin}% to{" "}
                  {sector.dealImpact.irrDeltaMax > 0 ? "+" : ""}
                  {sector.dealImpact.irrDeltaMax}%
                </strong>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ opacity: 0.55 }}>Planning risk: </span>
                {sector.dealImpact.planningRisk}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ opacity: 0.55 }}>Best suited for: </span>
                {sector.dealImpact.idealProjectSize}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: open ? "auto" : "none",
      }}
      aria-modal="true"
      role="dialog"
    >
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          border: "none",
          cursor: "pointer",
        }}
      />
      <div
        style={
          mobile
            ? {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
                maxHeight: "90vh",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                border: "1px solid #3f3f46",
                borderBottom: "none",
                overflow: "hidden",
                boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
              }
            : {
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
                width: "min(100%, 440px)",
                borderLeft: "1px solid #3f3f46",
                overflow: "hidden",
                boxShadow: "-8px 0 32px rgba(0,0,0,0.45)",
              }
        }
      >
        {panelInner}
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  titleCase,
}: {
  children: string;
  titleCase?: boolean;
}) {
  return (
    <h3
      style={{
        fontSize: titleCase ? 13 : 11,
        fontWeight: 700,
        letterSpacing: titleCase ? "0.02em" : "0.12em",
        opacity: titleCase ? 0.55 : 0.45,
        margin: "0 0 10px",
        textTransform: titleCase ? "none" : "uppercase",
      }}
    >
      {children}
    </h3>
  );
}
