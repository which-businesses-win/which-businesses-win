type Props = {
  title: string;
  kicker?: string;
  className?: string;
};

export function TerminalScreenTitle({ title, kicker, className = "" }: Props) {
  return (
    <header className={`mb-8 ${className}`}>
      {kicker ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-deal-muted">
          {kicker}
        </p>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight text-deal-text">{title}</h1>
    </header>
  );
}
