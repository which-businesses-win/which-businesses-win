import { getIngestSignals } from "@/lib/ingest";

export const dynamic = "force-dynamic";

const sectors = [
  { name: "UK Housebuilders", score: 78, trend: "up" as const },
  { name: "Build-to-Rent", score: 74, trend: "up" as const },
  { name: "Grid Batteries", score: 81, trend: "up" as const },
  { name: "High Street Retail", score: 38, trend: "down" as const },
  { name: "Small Landlords", score: 42, trend: "down" as const },
];

export default async function Home() {
  const data = await getIngestSignals();

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
      <h1 style={{ fontSize: "40px", marginBottom: "30px" }}>
        Which Businesses Win — Live
      </h1>

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

      <h2 style={{ marginTop: "40px", marginBottom: "16px" }}>Live Signals</h2>
      <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "20px" }}>
        Ranked by headline scoring; reasons explain the call.
      </p>

      {data.signals.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No signals loaded (feeds may be unreachable).</div>
      ) : (
        data.signals.map((s, i) => (
          <div key={`${s.link ?? s.title}-${i}`} style={{ marginBottom: "20px" }}>
            <div>
              <strong style={{ color: "#00ff9d" }}>{s.type.toUpperCase()}</strong>
              {" — "}
              Score: {s.score}
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
