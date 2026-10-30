import type { ReactNode } from "react";

export function PageHeader({
  title,
  finding,
  actions,
}: {
  title: string;
  finding?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {finding ? <p className="page-finding mt-1.5 max-w-[68ch]">{finding}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
