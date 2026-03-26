type Props = {
  value: React.ReactNode;
  label: string;
  delta?: React.ReactNode;
  className?: string;
};

export function MetricHero({ value, label, delta, className = "" }: Props) {
  return (
    <div className={className}>
      <div className="text-5xl font-bold tabular-nums tracking-tight text-deal-green md:text-6xl">
        {value}
      </div>
      <div className="mt-2 text-sm text-deal-muted">{label}</div>
      {delta != null ? (
        <div className="mt-1 text-lg font-semibold tabular-nums text-deal-green">{delta}</div>
      ) : null}
    </div>
  );
}
