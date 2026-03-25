"use client";

import { useEffect, useState } from "react";

import type { IngestSignal, TrendRow } from "@/lib/ingest";
import type { Insight } from "@/lib/insights";
import type { DealImpact } from "@/lib/impact";

const sectors = [
  { name: "UK Housebuilders", score: 78, trend: "up" as const },
  { name: "Build-to-Rent", score: 74, trend: "up" as const },
  { name: "Grid Batteries", score: 81, trend: "up" as const },
  { name: "High Street Retail", score: 38, trend: "down" as const },
  { name: "Small Landlords", score: 42, trend: "down" as const },
];

export default function Home() {
  const [location, setLocation] = useState("leeds");
  const [sector, setSector] = useState("general");
  const [signals, setSignals] = useState<IngestSignal[]>([]);
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [impact, setImpact] = useState<DealImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          signals: IngestSignal[];
          trends?: TrendRow[];
          insights?: Insight[];
          impact?: DealImpact;
        }) => {
          setSignals(data.signals ?? []);
          setTrends(data.trends ?? []);
          setInsights(data.insights ?? []);
          setImpact(data.impact ?? null);
        },
      )
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load signals");
        setSignals([]);
        setTrends([]);
        setInsights([]);
        setImpact(null);
      })
      .finally(() => setLoading(false));
  }, [location, sector]);

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "system-ui",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "12px" }}>Deal impact</h2>
      <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "16px" }}>
        Illustrative IRR delta from headline drivers (top 10 signals only).
      </p>
      {!loading && impact ? (
        <div style={{ marginBottom: "28px", padding: "16px", border: "1px solid #27272a", borderRadius: "12px", background: "#0c0c0c" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong>IRR impact:</strong>{" "}
            <span style={{ color: impact.irrImpact >= 0 ? "#34d399" : "#f87171" }}>
              {impact.irrImpact > 0 ? "+" : ""}
              {impact.irrImpact}%
            </span>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <strong>Risk level:</strong> {impact.riskLevel}
          </div>
          {impact.drivers.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", opacity: 0.95 }}>
              {impact.drivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.7, margin: 0, fontSize: "14px" }}>
              No drivers matched in this slice.
            </p>
          )}
        </div>
      ) : loading ? (
        <div style={{ opacity: 0.7, marginBottom: "28px" }}>Loading impact…</div>
      ) : null}

      <h1 style={{ fontSize: "40px", marginBottom: "30px" }}>
        Which Businesses Win — Live
      </h1>

      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>Deal location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. leeds, manchester"
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "#171717",
              color: "white",
              minWidth: "200px",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>Sector</span>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "#171717",
              color: "white",
            }}
          >
            <option value="general">General</option>
            <option value="retail">Retail</option>
            <option value="residential">Residential</option>
            <option value="planning">Planning</option>
            <option value="macro">Macro</option>
          </select>
        </label>
      </div>

      <h2 style={{ marginTop: "8px", marginBottom: "12px" }}>What this means</h2>
      <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "16px" }}>
        Risk, warning, and opportunity — derived from this run&apos;s signals and
        stored patterns.
      </p>
      {!loading && insights.length > 0 ? (
        <div style={{ marginBottom: "32px" }}>
          {insights.map((i, idx) => {
            const color =
              i.type === "risk"
                ? "#f87171"
                : i.type === "warning"
                  ? "#fbbf24"
                  : "#34d399";
            return (
              <div
                key={idx}
                style={{
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #27272a",
                }}
              >
                <strong style={{ color }}>{i.type.toUpperCase()}</strong>
                <div style={{ marginTop: "6px" }}>{i.message}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: "6px" }}>
                  → {i.action}
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && insights.length === 0 && !error ? (
        <p style={{ opacity: 0.65, marginBottom: "32px" }}>
          No automated insights yet — thresholds not met on this run.
        </p>
      ) : null}

      {sectors.map((s) => (
        <div
          key={s.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid #222",
          }}
        >
          <span>{s.name}</span>
          <span
            style={{
              color: s.trend === "up" ? "#00ff9d" : "#ff4d4d",
            }}
          >
            {s.trend === "up" ? "↑" : "↓"} {s.score}
          </span>
        </div>
      ))}

      <h2 style={{ marginTop: "40px", marginBottom: "12px" }}>Emerging patterns</h2>
      <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "16px" }}>
        Aggregated from stored signals (location × type).
      </p>
      {!loading && trends.length > 0 ? (
        <div style={{ marginBottom: "28px" }}>
          {trends.map((t, i) => (
            <div
              key={`${t.type}-${t.location ?? "none"}-${i}`}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #222",
                fontSize: "15px",
              }}
            >
              <strong style={{ color: "#a78bfa" }}>{t.type}</strong> activity —{" "}
              {t.location ? (
                <span>{t.location}</span>
              ) : (
                <span style={{ opacity: 0.75 }}>no location tag</span>
              )}{" "}
              <span style={{ opacity: 0.65 }}>({t.count} signals)</span>
            </div>
          ))}
        </div>
      ) : !loading && trends.length === 0 && !error ? (
        <p style={{ opacity: 0.65, marginBottom: "28px" }}>
          No pattern history yet — refresh after a few ingests.
        </p>
      ) : null}

      <h2 style={{ marginTop: "40px", marginBottom: "16px" }}>Deal signals</h2>
      <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "20px" }}>
        Filtered and ranked for your deal context (location + sector).
      </p>

      {loading ? (
        <div style={{ opacity: 0.7 }}>Loading signals…</div>
      ) : error ? (
        <div style={{ color: "#f87171" }}>{error}</div>
      ) : signals.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No signals loaded (feeds may be unreachable).</div>
      ) : (
        signals.map((s, i) => (
          <div key={`${s.link ?? s.title}-${i}`} style={{ marginBottom: "20px" }}>
            <div>
              <strong style={{ color: "#00ff9d" }}>{s.type.toUpperCase()}</strong>
              {" — "}
              Score: {s.score}
              <span style={{ opacity: 0.65, fontSize: "14px", marginLeft: "8px" }}>
                (base {s.baseScore}
                {s.relevance > 0 ? ` + relevance ${s.relevance}` : ""}
                {s.planningWeight > 0 ? ` + planning ${s.planningWeight}` : ""})
              </span>
              {s.source ? (
                <span style={{ opacity: 0.65, fontSize: "14px" }}> · {s.source}</span>
              ) : null}
            </div>

            <div style={{ marginTop: "6px" }}>
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
                <span>{s.title}</span>
              )}
            </div>

            {s.location ? (
              <div style={{ fontSize: 12, marginTop: "4px" }}>
                📍 {s.location.toUpperCase()}
              </div>
            ) : null}

            <div style={{ fontSize: 12, opacity: 0.7, marginTop: "4px" }}>
              Confidence: {Math.round(s.confidence * 100)}%
            </div>

            {s.reasons.length > 0 ? (
              <ul style={{ margin: "8px 0 0", paddingLeft: "20px", fontSize: "14px", opacity: 0.9 }}>
                {s.reasons.map((r, j) => (
                  <li key={j}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))
      )}
    </main>
  );
}
