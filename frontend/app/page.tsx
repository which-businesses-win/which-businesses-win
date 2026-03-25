export default function Home() {
  return (
    <main style={{
      background: "#0a0a0a",
      color: "white",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      fontFamily: "system-ui"
    }}>
      <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>
        Which Businesses Win
      </h1>

      <p style={{ fontSize: "18px", opacity: 0.7, marginBottom: "24px" }}>
        Real-time intelligence for development deals
      </p>

      <button style={{
        padding: "12px 20px",
        background: "white",
        color: "black",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer"
      }}>
        Run a Deal
      </button>
    </main>
  );
}
