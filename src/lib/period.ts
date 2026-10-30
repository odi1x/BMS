/**
 * نموذج الفترة المالية — السنة والشهر.
 *
 * كل الشاشات المالية تقرأ الفترة من query string (?year=&month=)
 * حتى يتمكّن المستخدم من تصفية السجلات والتقارير على أي شهر.
 */

export const CURRENT_FISCAL_YEAR = 2026;
export const CURRENT_FISCAL_MONTH = 8;

/** الأشهر التي تحتوي بيانات فعلية في السجل التجريبي. */
export const FISCAL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8];

/** السنوات المتاحة في الأرشيف. */
export const FISCAL_YEARS = [2024, 2025, 2026, 2027];

export type FiscalPeriod = {
  year: number;
  month: number;
};

export type PeriodQuery = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** يقرأ الفترة من query string مع مراجعة القيم غير الصالحة. */
export function resolvePeriod(params: PeriodQuery): FiscalPeriod {
  const rawYear = Number(firstValue(params.year));
  const rawMonth = Number(firstValue(params.month));

  const year =
    Number.isInteger(rawYear) && rawYear >= 2020 && rawYear <= 2100
      ? rawYear
      : CURRENT_FISCAL_YEAR;
  const month =
    Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth
      : CURRENT_FISCAL_MONTH;

  return { year, month };
}

/** يبني معطيات query للفترة (بدون ?). */
export function periodParams(period: FiscalPeriod): string {
  return `year=${period.year}&month=${period.month}`;
}

/** يضيف الفترة إلى رابط مع الحفاظ على بقية المعطيات. */
export function withPeriod(href: string, period: FiscalPeriod): string {
  const [base, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("year", String(period.year));
  params.set("month", String(period.month));
  return `${base}?${params.toString()}`;
}

/** يزيل معطيات الفترة من رابط (للرجوع إلى المسار الافتراضي). */
export function withoutPeriod(href: string): string {
  const [base, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.delete("year");
  params.delete("month");
  const rest = params.toString();
  return rest ? `${base}?${rest}` : base;
}

/** آخر يوم في الشهر الميلادي (1-based). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** تاريخ ISO لآخر يوم في الشهر — يُستخدم كقيمة افتراضية لحقول التاريخ. */
export function periodEndDate(period: FiscalPeriod): string {
  const day = lastDayOfMonth(period.year, period.month);
  return `${period.year}-${String(period.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
