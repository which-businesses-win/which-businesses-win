import Link from "next/link";

type Props = {
  name: string;
  irr: string;
  uplift?: string | null;
  href?: string;
  subtitle?: string;
  className?: string;
};

export function DealCard({
  name,
  irr,
  uplift,
  href,
  subtitle,
  className = "",
}: Props) {
  const inner = (
    <>
      <div className="font-medium text-deal-text">{name}</div>
      {subtitle ? (
        <div className="mt-0.5 text-xs text-deal-muted">{subtitle}</div>
      ) : null}
      <div className="mt-2 text-lg font-semibold tabular-nums text-deal-green">
        {irr}
        {uplift ? (
          <span className="ml-1.5 text-base font-bold text-deal-green-hi">{uplift}</span>
        ) : null}
      </div>
    </>
  );

  const shell = `rounded-xl border border-deal-border bg-deal-bg p-4 mb-4 ${className}`;

  if (href) {
    return (
      <Link href={href} className={`block ${shell} transition-colors hover:border-deal-muted`}>
        {inner}
      </Link>
    );
  }

  return <div className={shell}>{inner}</div>;
}
