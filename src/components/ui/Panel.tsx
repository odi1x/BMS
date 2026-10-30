import type { ReactNode } from "react";

export function Panel({
  id,
  title,
  hint,
  action,
  children,
  className = "",
  bodyClassName = "",
  headingLevel = "h2",
}: {
  id?: string;
  title?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <section id={id} className={`panel flex flex-col ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <Heading className="panel-title">{title}</Heading>
            {hint ? <p className="panel-hint mt-0.5">{hint}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div
        className={`flex-1 px-5 pb-5 ${title ? "" : "pt-5"} ${bodyClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
