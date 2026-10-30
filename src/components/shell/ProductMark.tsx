/**
 * The product's mark: a tower of units with one collected.
 * Drawn from the product's own object — the settlement tower that is the
 * signature element of the dashboard — not a black square with a letter.
 */
export function ProductMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="اتحاد الملاك"
      className="shrink-0"
    >
      <rect x="0" y="0" width="24" height="24" rx="6" fill="var(--ink)" />
      <rect x="5.5" y="3.5" width="5" height="5" rx="1.2" fill="var(--accent-light)" />
      <rect x="13.5" y="3.5" width="5" height="5" rx="1.2" fill="var(--surface)" />
      <rect x="5.5" y="10.5" width="5" height="5" rx="1.2" fill="var(--surface)" />
      <rect x="13.5" y="10.5" width="5" height="5" rx="1.2" fill="var(--surface)" />
      <rect x="5.5" y="17.5" width="5" height="5" rx="1.2" fill="var(--surface)" />
      <rect x="13.5" y="17.5" width="5" height="5" rx="1.2" fill="var(--surface)" />
    </svg>
  );
}
