export default function Home() {
  const sectors = [
    { name: "UK Housebuilders", score: 78, trend: "up" },
    { name: "Build-to-Rent", score: 74, trend: "up" },
    { name: "Grid Batteries", score: 81, trend: "up" },
    { name: "High Street Retail", score: 38, trend: "down" },
    { name: "Small Landlords", score: 42, trend: "down" },
  ];

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

      {sectors.map((s, i) => (
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

      <h2 style={{ marginTop: "40px" }}>Live Signals</h2>

      <div style={{ marginTop: "20px" }}>
        <div>[+18] Planning reform momentum increasing</div>
        <div>[-22] Green belt resistance rising</div>
        <div>[+12] Capital flowing into BTR</div>
      </div>
    </main>
  );
}
