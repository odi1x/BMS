import type { ReactNode } from "react";

export type Metric = {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  answer?: boolean;
  tone?: "negative";
};

/**
 * Headline numbers get no tile of their own: one container split by
 * hairlines into equal columns, label over value.
 */
export function MetricStrip({
  items,
  columns,
}: {
  items: Metric[];
  columns?: number;
}) {
  const count = columns ?? items.length;

  return (
    <div
      className="metric-band"
      style={{ "--metric-columns": count } as React.CSSProperties}
    >
      {items.map((item) => (
        <div key={item.label} className="metric-cell">
          <p className="metric-label">{item.label}</p>
          <div className="metric-figure">
            <p
              className={`metric-value ${item.answer ? "metric-answer" : ""} ${
                item.tone === "negative" ? "text-negative-ink" : ""
              }`}
            >
              {item.value}
            </p>
            {item.unit ? <span className="metric-unit">{item.unit}</span> : null}
          </div>
          {item.hint ? <p className="metric-hint">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
