const nav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why it wins", href: "#why-wins" },
  { label: "Intelligence", href: "#intelligence" },
];

const steps = [
  {
    title: "Ingest the deal",
    body: "Connect assumptions, comparables, and sponsor history in one structured view—no more scattered spreadsheets.",
  },
  {
    title: "Score in real time",
    body: "Models update as inputs change, so credit and delivery risk surface before the committee meeting.",
  },
  {
    title: "Decide with evidence",
    body: "Export a defensible narrative: what wins, what breaks, and what would need to be true.",
  },
];

const wins = [
  {
    title: "Committee-grade clarity",
    body: "Positioning that reads like risk infrastructure, not a side project—built for IC memos and lender scrutiny.",
  },
  {
    title: "Speed without sloppiness",
    body: "Faster iteration on scenarios without losing auditability of how you got to the number.",
  },
  {
    title: "Aligned incentives",
    body: "Developers see delivery path; lenders see repayment logic—same source of truth, fewer late surprises.",
  },
];

const layers = [
  {
    title: "Live comparables",
    body: "Benchmarks refresh as the market moves—so your floor isn’t last quarter’s PDF.",
  },
  {
    title: "Scenario spine",
    body: "Base, downside, and stretch tied to the same capital stack—change one lever, see the cascade.",
  },
  {
    title: "Sponsor signal",
    body: "Track record and covenant headroom in context, not as disconnected footnotes.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.85))]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <a href="/" className="text-sm font-semibold tracking-tight text-white">
            Which Businesses Win
          </a>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="hidden text-sm text-zinc-400 transition-colors hover:text-white sm:inline"
            >
              Talk to us
            </a>
            <a
              href="#demo"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Run a deal
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section
          id="demo"
          className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-28"
        >
          <p className="mb-4 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Infrastructure for development finance
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1] lg:text-6xl">
            See which businesses win—before you commit capital.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Live intelligence for development deals. Unify underwriting, delivery, and
            sponsor risk in one layer lenders and developers can actually trust.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Run a deal
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-6 py-3 text-base font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              How it works
            </a>
          </div>
          <dl className="mt-16 grid gap-8 border-t border-zinc-800 pt-10 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Who it&apos;s for
              </dt>
              <dd className="mt-2 text-sm text-zinc-300">
                Senior debt, stretch, and mezz teams; development directors; advisors on
                complex schemes.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Outcome
              </dt>
              <dd className="mt-2 text-sm text-zinc-300">
                Fewer surprises at drawdown, faster alignment between capital and delivery.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Posture
              </dt>
              <dd className="mt-2 text-sm text-zinc-300">
                Evidence-led decisions—documented, comparable, and ready for scrutiny.
              </dd>
            </div>
          </dl>
        </section>

        <section
          id="how-it-works"
          className="border-t border-zinc-800/80 bg-zinc-900/40 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400/90">
              How it works
            </h2>
            <p className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              From raw inputs to a decision everyone can stand behind.
            </p>
            <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {steps.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="why-wins" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400/90">
              Why this wins deals
            </h2>
            <p className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for committees, not slide decks.
            </p>
            <ul className="mt-14 grid gap-6 sm:grid-cols-3">
              {wins.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="intelligence"
          className="border-t border-zinc-800/80 bg-zinc-900/30 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400/90">
              Live intelligence layer
            </h2>
            <p className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              The market moves. Your view should too.
            </p>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {layers.map((layer) => (
                <div
                  key={layer.title}
                  className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900/80 to-zinc-950 p-6"
                >
                  <div className="h-1 w-12 rounded-full bg-emerald-500/60" aria-hidden />
                  <h3 className="mt-5 text-lg font-semibold text-white">{layer.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{layer.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="border-t border-zinc-800/80 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Ready to put this in front of your next committee?
            </h2>
            <p className="mt-4 text-zinc-400">
              We&apos;re onboarding capital partners and development teams who want a single
              source of truth for complex schemes.
            </p>
            <a
              href="mailto:hello@whichbusinesses.win"
              className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Request access
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-zinc-800/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Which Businesses Win</p>
          <p className="text-center sm:text-right">
            Intelligence infrastructure for development finance.
          </p>
        </div>
      </footer>
    </div>
  );
}
