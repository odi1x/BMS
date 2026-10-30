"use client";

import { Printer } from "lucide-react";

export function PrintButton({
  label,
  className = "btn btn-primary",
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <Printer size={16} strokeWidth={1.7} aria-hidden="true" />
      {label}
    </button>
  );
}
