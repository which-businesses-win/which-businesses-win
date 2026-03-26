type Props = {
  name: string;
  score: number;
  delta: number | null;
  label: string;
  className?: string;
};

export function SignalRow({ name, score, delta, label, className = "" }: Props) {
  const deltaStr =
    delta == null
      ? "—"
      : `${delta >= 0 ? "↑" : "↓"} ${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta))}`;

  return (
    <div
      className={`flex justify-between gap-4 border-b border-deal-border py-3 text-sm ${className}`}
    >
      <div className="min-w-0 shrink text-deal-text">{name}</div>
      <div className="shrink-0 text-right">
        <div className="font-semibold tabular-nums text-deal-green">
          {score}
          {delta != null ? ` ${deltaStr}` : ""}
        </div>
        <div className="text-xs text-deal-muted">{label}</div>
      </div>
    </div>
  );
}
