type Props = { text: string; className?: string };

export function RiskFlag({ text, className = "" }: Props) {
  return (
    <div className={`text-sm text-deal-orange ${className}`}>⚠️ {text}</div>
  );
}
