import Link from "next/link";

const section = { marginBottom: 28 } as const;

const h2 = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.14em",
  opacity: 0.5,
  margin: "0 0 12px",
} as const;

const quote = {
  fontSize: 16,
  lineHeight: 1.55,
  margin: "0 0 14px",
  paddingLeft: 14,
  borderLeft: "2px solid #3f3f46",
  opacity: 0.92,
} as const;

/** Live demo script — sophisticated capital / credit audience (e.g. Alex Blakeborough). */
export default function PitchPage() {
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
      <p
        style={{
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Link href="/" style={{ color: "#a78bfa", fontSize: 14, textDecoration: "none" }}>
          ← Home
        </Link>
        <Link href="/objections" style={{ color: "#e7e5e4", fontSize: 14, textDecoration: "none" }}>
          Lender Q&amp;A
        </Link>
      </p>

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          color: "#737373",
          marginBottom: 8,
        }}
      >
        PLANSUREAI · LIVE DEMO (UNDER 2 MIN)
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
        Control the room
      </h1>
      <p style={{ fontSize: 14, opacity: 0.55, marginBottom: 28, lineHeight: 1.5 }}>
        PlanSureAI — Market Intelligence for Development Finance
      </p>

      <section style={section}>
        <h2 style={h2}>OPENING (ANCHOR IT)</h2>
        <p style={quote}>
          &ldquo;Everything here is built around one idea — most development deals are analysed
          statically, but the market around them is constantly moving.&rdquo;
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>STEP 1 — SIGNALS (DON&apos;T LINGER)</h2>
        <p style={quote}>
          &ldquo;So at the top level, we track where capital is flowing and where planning risk is
          shifting.&rdquo;
        </p>
        <p style={{ ...quote, opacity: 0.65, fontSize: 14, borderLeft: "none", paddingLeft: 0 }}>
          (Point briefly.) &ldquo;For example — Manchester BTR is currently one of the strongest
          positions.&rdquo;
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>STEP 2 — SHOW REASONING (BUILD TRUST)</h2>
        <p style={quote}>
          &ldquo;And this isn&apos;t just a score — you can see what&apos;s driving it: capital
          inflows, rental demand, and local planning conditions.&rdquo;
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>STEP 3 — THIS IS THE MOMENT</h2>
        <p style={quote}>
          &ldquo;Where it becomes useful is when we apply that directly to a deal.&rdquo;
        </p>
        <p style={quote}>
          &ldquo;So this scheme moves from 17% to just under 20% purely based on current market
          conditions.&rdquo;
        </p>
        <p style={{ fontSize: 13, opacity: 0.45, margin: 0 }}>Pause — let that sit.</p>
      </section>

      <section style={section}>
        <h2 style={h2}>STEP 4 — SHOW YOU UNDERSTAND RISK</h2>
        <p style={quote}>
          &ldquo;But equally — if planning tightens, you&apos;re back down closer to 16%.&rdquo;
        </p>
        <p style={{ fontSize: 13, opacity: 0.45, margin: 0 }}>
          This is what makes you credible.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>STEP 5 — SHOW OUTPUT (CLOSES THE LOOP)</h2>
        <p style={{ ...quote, marginBottom: 0 }}>
          &ldquo;And this generates a clean investment memo — which is effectively what gets shared
          internally or with capital.&rdquo;
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>CLOSE (DON&apos;T OVERSELL)</h2>
        <p style={{ ...quote, marginBottom: 0 }}>
          &ldquo;So the goal isn&apos;t more analysis — it&apos;s faster, more informed decisions on
          where to deploy capital.&rdquo;
        </p>
      </section>

      <section style={{ ...section, marginTop: 36 }}>
        <h2 style={h2}>WHEN THEY ASK &ldquo;WHAT IS THIS?&rdquo;</h2>
        <p style={{ ...quote, marginBottom: 0 }}>
          Don&apos;t say &ldquo;platform&rdquo; or &ldquo;tool&rdquo;. Say:{" "}
          <strong style={{ fontWeight: 600, opacity: 1 }}>
            &ldquo;It&apos;s a live intelligence layer that sits on top of development
            deals.&rdquo;
          </strong>
        </p>
      </section>
    </main>
  );
}
