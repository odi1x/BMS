import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";

export function Money({
  value,
  unit,
  className = "",
  signed = false,
}: {
  value: number;
  unit?: string;
  className?: string;
  signed?: boolean;
}) {
  const prefix = signed && value > 0 ? "+" : "";
  return (
    <span className={`num ${className}`}>
      {prefix}
      {formatMoney(value)}
      {unit ? <span className="ms-1 text-[11px] text-ink-faint">{unit}</span> : null}
    </span>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "positive" | "negative" | "neutral";
  children: ReactNode;
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
