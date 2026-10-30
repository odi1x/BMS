import { formatMoney } from "@/lib/format";

export type BarListRow = {
  label: string;
  value: number;
  hint?: string;
};

/**
 * A ranked list where the bar is thin and grey — the top item in ink —
 * so the ranking is seen and not only read.
 */
export function BarList({
  rows,
  unit,
  max,
}: {
  rows: BarListRow[];
  unit?: string;
  max?: number;
}) {
  const ceiling = max ?? Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="flex flex-col">
      {rows.map((row, index) => {
        const ratio = ceiling === 0 ? 0 : Math.min(1, row.value / ceiling);
        return (
          <li
            key={row.label}
            className="border-b border-divider py-2.5 last:border-b-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink" title={row.label}>
                {row.label}
              </span>
              <span className="num shrink-0 text-[13px] text-ink">
                {formatMoney(row.value)}
                {unit ? <span className="ms-1 text-[11px] text-ink-faint">{unit}</span> : null}
              </span>
            </div>
            <span className="mt-1.5 block h-[2px] w-full bg-chip">
              <span
                className="block h-[2px]"
                style={{
                  width: `${Math.max(ratio * 100, row.value > 0 ? 2 : 0)}%`,
                  background: index === 0 ? "var(--ink)" : "var(--line-strong)",
                }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
