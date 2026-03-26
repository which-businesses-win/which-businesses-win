/**
 * Static marketing block — mirrors DealTerminal structure (Market Signal integration).
 */
export default function DealTerminalShowcase() {
  return (
    <div className="rounded-xl border border-deal-border bg-deal-bg px-5 py-6 text-deal-text">
      <h2 className="mb-1 text-[18px] font-bold leading-snug tracking-tight">
        Manchester Build-to-Rent Scheme
      </h2>
      <p className="mb-6 text-[11px] font-medium tracking-wide text-deal-muted">
        Manchester · Build To Rent
      </p>

      <p className="mb-4 text-base font-semibold tabular-nums text-deal-text">Base IRR: 17.0%</p>

      <div className="mb-6 rounded-r-lg border border-deal-border border-l-2 border-l-deal-green bg-zinc-950/40 px-4 py-4">
        <div className="flex flex-col gap-2">
          <p className="order-2 text-[11px] font-bold uppercase tracking-[0.14em] text-deal-green md:order-1">
            Market Signal
          </p>
          <p className="order-1 text-2xl font-bold tabular-nums text-deal-green md:order-2 md:text-xl">
            +2.7% IRR
          </p>
          <p className="order-3 text-sm leading-snug text-deal-text">
            Market Signal indicates{" "}
            <span className="font-semibold text-deal-green">strong tailwind</span> locally.
          </p>
          <p className="order-4 text-lg font-extrabold tabular-nums text-deal-green md:text-xl">
            → Adjusted IRR: 19.7%
          </p>
        </div>
      </div>

      <div className="mb-6 flex w-full items-center justify-center rounded-lg bg-deal-green px-5 py-3.5 text-base font-extrabold tracking-tight text-black sm:inline-flex sm:w-auto sm:justify-start">
        → Proceed
      </div>

      <p className="mb-5 text-[13px] tabular-nums text-deal-muted">Stressed IRR: 14.2%</p>

      <p className="mb-5 text-[13px] text-deal-muted">
        Planning Moderate · Market Signal supportive
      </p>

      <div className="inline-flex w-full items-center justify-center rounded-lg border border-deal-border px-3.5 py-3 text-[13px] font-semibold text-deal-muted sm:w-auto">
        View signal detail ↓
      </div>
    </div>
  );
}
