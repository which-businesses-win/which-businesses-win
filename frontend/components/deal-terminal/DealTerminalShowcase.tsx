/**
 * Static marketing block — example deal IRR impact (homepage conversion).
 */
export default function DealTerminalShowcase() {
  return (
    <div className="rounded-xl border border-deal-border bg-deal-bg px-5 py-6 text-deal-text">
      <h2 className="mb-1 text-[18px] font-bold leading-snug tracking-tight">
        Manchester Build-to-Rent Scheme
      </h2>
      <p className="mb-5 text-[11px] font-medium tracking-wide text-deal-muted">
        Manchester · Build-to-Rent
      </p>

      <p className="mb-2 text-base font-semibold tabular-nums text-deal-text">Base IRR: 17.0%</p>
      <p className="mb-1 text-base font-semibold tabular-nums text-deal-green">
        Market-adjusted IRR: 19.7%{" "}
        <span className="text-deal-green-hi">(+2.7%)</span>
      </p>
      <p className="mb-5 text-[12px] font-medium text-deal-muted">
        Driven by current market conditions
      </p>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-deal-muted">
        Drivers
      </p>
      <ul className="mb-0 list-none space-y-1.5 p-0 text-sm font-medium text-deal-text">
        <li className="flex gap-2">
          <span className="text-deal-green">→</span>
          Strong local rental demand
        </li>
        <li className="flex gap-2">
          <span className="text-deal-green">→</span>
          Institutional capital inflows
        </li>
        <li className="flex gap-2">
          <span className="text-deal-green">→</span>
          Favourable planning conditions
        </li>
      </ul>
    </div>
  );
}
