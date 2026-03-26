/**
 * Static marketing block — example deal IRR impact (homepage conversion).
 */
export default function DealTerminalShowcase() {
  return (
    <div className="rounded-xl border border-deal-border bg-deal-bg px-5 py-6 text-deal-text">
      <h2 className="mb-1 text-[18px] font-bold leading-snug tracking-tight">
        Manchester Build-to-Rent Scheme
      </h2>
      <p className="mb-6 text-[11px] font-medium tracking-wide text-deal-muted">
        Manchester · Build-to-Rent
      </p>

      <div className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-3xl font-medium tabular-nums text-deal-text/70">17.0%</span>
          <span className="max-w-[6.5rem] shrink-0 text-right text-[10px] leading-tight tracking-tighter text-deal-muted/40">
            base
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-3xl font-bold tabular-nums text-deal-green">+2.7%</span>
          <span className="max-w-[6.5rem] shrink-0 text-right text-[10px] leading-tight tracking-tighter text-deal-muted/35">
            market impact
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="inline-flex items-baseline gap-0.5 text-3xl font-semibold tabular-nums text-deal-green">
            <span className="text-deal-muted/70">→</span>
            19.7%
          </span>
          <span className="max-w-[6.5rem] shrink-0 text-right text-[10px] leading-tight tracking-tighter text-deal-muted/40">
            adjusted
          </span>
        </div>
      </div>

      <div className="mt-10 space-y-1.5 text-[13px] font-semibold leading-snug">
        <p className="mb-1 text-[10px] font-medium tracking-tighter text-deal-muted/55">
          Market signals:
        </p>
        <p className="text-deal-green">↑ Strong local rental demand</p>
        <p className="text-deal-green">↑ Institutional capital inflows</p>
        <p className="text-deal-green">↑ Favourable planning conditions</p>
      </div>
      <p className="mt-5 text-[11px] tabular-nums text-deal-muted/45">Confidence: 78%</p>
    </div>
  );
}
