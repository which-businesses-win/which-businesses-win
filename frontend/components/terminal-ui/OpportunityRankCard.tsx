type Props = {
  rank: number;
  name: string;
  subtitle: string;
  score: number;
  irrLine: string;
  uplift?: string | null;
  tags: string[];
  selected?: boolean;
  className?: string;
};

/**
 * Ranked pipeline row — score + IRR + short tags (sourcing feed).
 */
export function OpportunityRankCard({
  rank,
  name,
  subtitle,
  score,
  irrLine,
  uplift,
  tags,
  selected = false,
  className = "",
}: Props) {
  const tagLine = tags.filter(Boolean).join(" · ");
  return (
    <div
      className={`rounded-xl border bg-deal-bg p-4 mb-4 transition-colors ${
        selected ? "border-deal-green" : "border-deal-border"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tabular-nums text-deal-muted">
              {rank}.
            </span>
            <span className="truncate font-medium text-deal-text">{name}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-deal-muted">{subtitle}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-deal-muted">
            Market position score
          </div>
          <div className="text-xl font-bold tabular-nums text-deal-green">
            {Math.round(score)}
          </div>
        </div>
      </div>
      <div className="mt-3 text-lg font-semibold tabular-nums text-deal-green">
        {irrLine}
        {uplift ? (
          <span className="ml-1.5 text-base font-bold text-deal-green-hi">{uplift}</span>
        ) : null}
      </div>
      {tagLine ? (
        <p className="mt-2 text-xs font-medium text-deal-muted">{tagLine}</p>
      ) : null}
    </div>
  );
}
