"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FISCAL_MONTHS, FISCAL_YEARS, type FiscalPeriod } from "@/lib/period";
import { monthName } from "@/lib/format";

export function PeriodPicker({
  period,
  months = FISCAL_MONTHS,
  years = FISCAL_YEARS,
  showMonth = true,
  labels,
}: {
  period: FiscalPeriod;
  months?: number[];
  years?: number[];
  showMonth?: boolean;
  labels: { fiscalYear: string; month: string; locale: "ar" | "en" };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = (next: FiscalPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(next.year));
    params.set("month", String(next.month));
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className="period-picker mb-4 flex flex-wrap items-center gap-2"
      data-pending={pending ? "true" : "false"}
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="sr-only" htmlFor="period-year">
          {labels.fiscalYear}
        </label>
        <select
          id="period-year"
          className="select select-year"
          value={period.year}
          onChange={(event) => apply({ ...period, year: Number(event.target.value) })}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {showMonth ? (
          <>
            <span aria-hidden="true" className="text-ink-faint">
              /
            </span>
            <label className="sr-only" htmlFor="period-month">
              {labels.month}
            </label>
            <select
              id="period-month"
              className="select select-month"
              value={period.month}
              onChange={(event) => apply({ ...period, month: Number(event.target.value) })}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {monthName(month, labels.locale)} ({month})
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>
    </div>
  );
}
