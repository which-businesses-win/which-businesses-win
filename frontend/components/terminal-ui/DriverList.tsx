export type DriverItem = { type: "pos" | "neg"; text: string };

type Props = {
  items: DriverItem[];
  className?: string;
};

export function DriverList({ items, className = "" }: Props) {
  return (
    <div className={`space-y-1 text-sm ${className}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className={item.type === "pos" ? "text-deal-green" : "text-deal-red"}
        >
          {item.type === "pos" ? "+" : "−"} {item.text}
        </div>
      ))}
    </div>
  );
}
