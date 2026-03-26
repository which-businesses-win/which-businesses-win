"use client";

import {
  getSignalLabel,
  isTopMover,
  type MarketSectorRow,
} from "@/lib/marketSignalsBoard";

const LABEL_COLORS: Record<
  ReturnType<typeof getSignalLabel>["color"],
  string
> = {
  green: "#4ade80",
  "green-light": "#86efac",
  grey: "#a1a1aa",
  orange: "#fb923c",
  red: "#f87171",
};

function formatDelta(delta: number | null): { arrow: string; text: string } {
  if (delta === null) return { arrow: "↑", text: "+?" };
  if (delta > 0) return { arrow: "↑", text: `+${delta}` };
  if (delta < 0) return { arrow: "↓", text: `${delta}` };
  return { arrow: "·", text: "0" };
}

type Props = {
  sectors: MarketSectorRow[];
  onSectorClick?: (id: string) => void;
  /** Trust line under subtitle, e.g. signal count + recency */
  credibilityLine?: string;
  /** Parent supplies section title — hide built-in heading + subtitle */
  omitHeader?: boolean;
};

export default function MarketSignalsBoard({
  sectors,
  onSectorClick,
  credibilityLine,
  omitHeader = false,
}: Props) {
  return (
    <section style={{ marginBottom: omitHeader ? 0 : 36 }}>
      {!omitHeader ? (
        <>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            Market Signals — Live
          </h2>
          <p
            style={{
              fontSize: 13,
              opacity: 0.55,
              margin: "0 0 20px",
              lineHeight: 1.45,
            }}
          >
            Real-time positioning across UK development sectors
          </p>
          {credibilityLine ? (
            <p
              style={{
                fontSize: 12,
                opacity: 0.72,
                margin: "-12px 0 20px",
                lineHeight: 1.5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {credibilityLine}
            </p>
          ) : null}
        </>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {sectors.map((row, index) => {
          const rank = index + 1;
          const signal = getSignalLabel(row.score);
          const labelColor = LABEL_COLORS[signal.color];
          const { arrow, text } = formatDelta(row.delta);
          const topMover = isTopMover(row.delta);
          const interactive = Boolean(onSectorClick);
          const title =
            row.shortCode && row.shortCode.trim().length > 0
              ? `${row.name} (${row.shortCode})`
              : row.name;

          return (
            <div
              key={row.id}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={() => onSectorClick?.(row.id)}
              onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSectorClick?.(row.id);
                }
              }}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid #27272a",
                cursor: interactive ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    opacity: 0.45,
                    minWidth: 28,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {rank}.
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      gap: "6px 10px",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {title}
                    </div>
                    {topMover ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          color: "#fde047",
                          border: "1px solid #854d0e",
                          background: "#422006",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        Top Mover
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      marginBottom: 6,
                      fontVariantNumeric: "tabular-nums",
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                    }}
                  >
                    <span>{row.score}</span>
                    <span style={{ opacity: 0.85 }}>
                      {arrow} {text}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 10,
                      color: labelColor,
                    }}
                  >
                    {signal.label}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.88 }}>
                    {row.driver}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
