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
        <p className="text-3xl font-medium tabular-nums text-deal-text/50">17.0%</p>
        <p className="text-3xl font-medium tabular-nums text-deal-text/75">+2.7%</p>
        <p className="inline-flex items-baseline gap-0.5 text-3xl font-semibold tabular-nums text-deal-text">
          <span className="text-deal-muted/55" aria-hidden>
            →
          </span>
          19.7%
        </p>
      </div>

      <span className="sr-only">Market signals</span>
      <div className="mt-10 space-y-1 text-[13px] font-semibold leading-tight">
        <p className="text-deal-text">↑ Capital targeting the sector</p>
        <p className="text-deal-text">+ Demand absorbing supply</p>
        <p className="text-deal-text">+ Institutional bids tightening underwriting</p>
        <p className="text-deal-text/65">− Planning friction slowing delivery</p>
        <p className="text-deal-text/65">− Build costs compressing developer margin</p>
      </div>
      <p className="mt-5 text-[11px] tabular-nums text-deal-muted/45">Confidence: 78%</p>
    </div>
  );
}
