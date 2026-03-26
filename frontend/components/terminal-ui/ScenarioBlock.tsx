type Row = { label: string; value: string; tone?: "bull" | "base" | "bear" };

type Props = {
  rows: Row[];
  className?: string;
};

function rowClass(tone: Row["tone"]) {
  if (tone === "bull") return "text-deal-green";
  if (tone === "bear") return "text-deal-red";
  return "text-deal-text";
}

export function ScenarioBlock({ rows, className = "" }: Props) {
  return (
    <div className={`space-y-1 text-sm ${className}`}>
      {rows.map((r, i) => (
        <div key={i} className={`tabular-nums ${rowClass(r.tone)}`}>
          {r.value} — {r.label}
        </div>
      ))}
    </div>
  );
}
