type Props = {
  name: string;
  score: number;
  delta: number | null;
  label: string;
  className?: string;
};

/**
 * Market list row — scan-first: score + momentum on one line, band label below.
 */
export function SignalRow({ name, score, delta, label, className = "" }: Props) {
  const deltaStr =
    delta == null
      ? "—"
      : `${delta >= 0 ? "↑" : "↓"} ${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta))}`;

  return (
    <div
      className={`flex justify-between gap-4 border-b border-deal-border py-3 text-sm ${className}`}
    >
      <div className="min-w-0 shrink font-medium text-deal-text">{name}</div>
      <div className="shrink-0 text-right">
        <div className="font-semibold tabular-nums text-deal-green">
          {score} {delta != null ? <span className="whitespace-nowrap">{deltaStr}</span> : null}
        </div>
        <div className="text-xs text-deal-muted">{label}</div>
      </div>
    </div>
  );
}
