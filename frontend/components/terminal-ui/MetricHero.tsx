type Props = {
  value: React.ReactNode;
  label: string;
  delta?: React.ReactNode;
  /** Colours the delta row — default positive green */
  deltaTone?: "positive" | "negative" | "neutral";
  className?: string;
};

function deltaClass(tone: Props["deltaTone"]) {
  if (tone === "negative") return "text-deal-red";
  if (tone === "neutral") return "text-deal-muted";
  return "text-deal-green";
}

export function MetricHero({
  value,
  label,
  delta,
  deltaTone = "positive",
  className = "",
}: Props) {
  return (
    <div className={className}>
      <div className="text-5xl font-bold tabular-nums tracking-tight text-deal-green md:text-6xl">
        {value}
      </div>
      <div className="mt-2 text-sm text-deal-muted">{label}</div>
      {delta != null ? (
        <div
          className={`mt-1 text-lg font-semibold tabular-nums ${deltaClass(deltaTone)}`}
        >
          {delta}
        </div>
      ) : null}
    </div>
  );
}
