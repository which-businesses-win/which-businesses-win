type Row = { label: string; value: string; tone?: "bull" | "base" | "bear" };

type Props = {
  rows: Row[];
  className?: string;
};

function rowClass(tone: Row["tone"]) {
  if (tone === "bull") return "text-deal-green font-semibold";
  if (tone === "bear") return "text-deal-red font-semibold";
  return "text-deal-text font-medium";
}

export function ScenarioBlock({ rows, className = "" }: Props) {
  return (
    <div className={`space-y-1 text-sm tabular-nums ${className}`}>
      {rows.map((r, i) => (
        <div key={i} className={rowClass(r.tone)}>
          {r.value} — {r.label}
        </div>
      ))}
    </div>
  );
}
