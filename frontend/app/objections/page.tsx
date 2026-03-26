import Link from "next/link";

type Qa = { q: string; sub?: string; a: string };

const ITEMS: Qa[] = [
  {
    q: "Where is this data coming from?",
    sub: "Is this real, or is it made up?",
    a: "We ingest planning decisions, market data, and capital activity, then structure that into signals. The key isn’t any single data source — it’s how consistently we interpret changes across them.",
  },
  {
    q: "How accurate is this?",
    sub: "Can I trust this enough to use it?",
    a: "It’s directionally accurate rather than precise — the value is in identifying movement early. It’s designed to support decisions, not replace underwriting.",
  },
  {
    q: "Why wouldn’t I just do this myself?",
    a: "You could — but it’s time-consuming and inconsistent. This standardises how market signals are interpreted and applies them instantly across deals.",
  },
  {
    q: "Is this just another scoring tool?",
    a: "No — the difference is we apply market conditions directly to deal outcomes. Most tools stop at insight, this translates it into IRR impact.",
  },
  {
    q: "What happens if the signals are wrong?",
    a: "Everything is transparent — you can see exactly what’s driving the output. It’s not a black box, it’s an additional layer of context.",
  },
  {
    q: "Who is this actually for?",
    a: "Developers, lenders, and investors making allocation decisions — anyone who needs to understand how market shifts affect deal performance.",
  },
];

const ADVANCED_ITEMS: Qa[] = [
  {
    q: "How is this different from our internal view?",
    sub: "We already think we understand the market.",
    a: "This isn’t trying to replace your internal view — it standardises how external signals are tracked and applies them consistently across deals. Most internal views are episodic — this updates continuously.",
  },
  {
    q: "What’s the edge here?",
    sub: "Why can’t this be replicated easily?",
    a: "The edge isn’t a single dataset — it’s the continuous interpretation layer. We’re tracking how planning, capital and demand signals evolve and feeding that directly into deal outcomes.",
  },
  {
    q: "How quickly does this react to change?",
    sub: "They care about timing.",
    a: "Signals are updated every few hours — so you see movement early, not after reports come out.",
  },
  {
    q: "Can this mislead decision-making?",
    sub: "This is a trap question.",
    a: "It’s designed to add context, not replace judgement. The value is highlighting where conditions are improving or deteriorating — the decision still sits with you.",
  },
  {
    q: "What happens in edge cases or niche deals?",
    sub: "They’re probing limits.",
    a: "It’s strongest on sectors and markets with active signal flow. For niche deals, it still provides directional context, but we wouldn’t position it as the sole input.",
  },
  {
    q: "How would we actually use this day-to-day?",
    sub: "This is the buying question.",
    a: "Three ways: (1) Screening — which deals to prioritise. (2) Validation — does this align with market direction. (3) Communication — generating a clear investment view quickly.",
  },
  {
    q: "What’s the risk of relying on it?",
    sub: "Final credibility test.",
    a: "The risk isn’t in using it — it’s in treating it as definitive. It’s a live signal layer that improves awareness, not a replacement for underwriting.",
  },
];

export default function ObjectionsPage() {
  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fafafa",
        minHeight: "100vh",
        padding: "32px 40px 56px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none" }}>
          ← Home
        </Link>
        <Link href="/pitch" style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none" }}>
          Demo script
        </Link>
      </div>

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: "#737373",
          marginBottom: 10,
        }}
      >
        PLANSUREAI — MARKET INTELLIGENCE FOR DEVELOPMENT FINANCE
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
        Investor &amp; lender objections
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.78, margin: "0 0 28px", maxWidth: 560 }}>
        These will come. If you handle them well, you look serious.
      </p>

      <section
        style={{
          marginBottom: 28,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #854d0e",
          background: "#1c1917",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", color: "#fde68a" }}>
          LANGUAGE RULE
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0, opacity: 0.92 }}>
          Never say <em>“AI says…”</em> or <em>“the model thinks…”</em> Always say{" "}
          <strong style={{ fontWeight: 600 }}>“market conditions suggest…”</strong>
        </p>
      </section>

      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {ITEMS.map((item, i) => (
          <li
            key={item.q}
            style={{
              marginBottom: 28,
              paddingBottom: 28,
              borderBottom: i < ITEMS.length - 1 ? "1px solid #27272a" : "none",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.45, margin: "0 0 6px" }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>
              {item.q}
            </h2>
            {item.sub ? (
              <p style={{ fontSize: 13, opacity: 0.5, margin: "0 0 12px", fontStyle: "italic" }}>
                What they’re really asking: {item.sub}
              </p>
            ) : null}
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: 0.9 }}>{item.a}</p>
          </li>
        ))}
      </ol>

      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          margin: "36px 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        After initial interest (advanced)
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.78, margin: "0 0 24px", maxWidth: 560 }}>
        When they start testing you — not the first pass.
      </p>

      <section
        style={{
          marginBottom: 28,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #3f3f46",
          background: "#141414",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", color: "#a78bfa" }}>
          IF YOU’RE STUCK
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, opacity: 0.92, fontStyle: "italic" }}>
          “It’s a directional intelligence layer, not a deterministic model.”
        </p>
      </section>

      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {ADVANCED_ITEMS.map((item, i) => (
          <li
            key={item.q}
            style={{
              marginBottom: 28,
              paddingBottom: 28,
              borderBottom: i < ADVANCED_ITEMS.length - 1 ? "1px solid #27272a" : "none",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.45, margin: "0 0 6px" }}>
              A{String(i + 1).padStart(2, "0")}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>
              {item.q}
            </h2>
            {item.sub ? (
              <p style={{ fontSize: 13, opacity: 0.5, margin: "0 0 12px", fontStyle: "italic" }}>
                What they’re really asking: {item.sub}
              </p>
            ) : null}
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: 0.9 }}>{item.a}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
