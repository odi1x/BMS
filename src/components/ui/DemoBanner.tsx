import { FlaskConical } from "lucide-react";

export function DemoBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-warning-line bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning-ink"
      role="status"
    >
      <FlaskConical size={15} strokeWidth={1.7} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
