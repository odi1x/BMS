export type Locale = "ar" | "en";

const NUMBER_LOCALE = "en-US";

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(round2(value));
}

export function formatMoneyCompact(value: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${formatNumber(value, fractionDigits)}%`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function currencyUnit(locale: Locale): string {
  return locale === "ar" ? "ر.س" : "SAR";
}

export function monthName(month: number, locale: Locale): string {
  return locale === "ar" ? AR_MONTHS_LOCAL[month - 1] : EN_MONTHS_LOCAL[month - 1];
}

export const AR_MONTHS_LOCAL = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const EN_MONTHS_LOCAL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDate(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatShortDate(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatDayMonth(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "numeric",
  }).format(value);
}

/** التاريخ الهجري بالتقويم الأم القرى. */
export function formatHijri(value: Date, locale: Locale): string {
  const parts = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-ca-islamic-umalqura-nu-latn" : "en-GB-u-ca-islamic-umalqura-nu-latn",
    { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" },
  ).formatToParts(value);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const day = get("day");
  const month = get("month");
  const year = get("year");
  return locale === "ar" ? `${day}/${month}/${year} هـ` : `${day}/${month}/${year} AH`;
}

export function formatMonthYear(month: number, year: number, locale: Locale): string {
  return locale === "ar"
    ? `${monthName(month, locale)} (${month}) ${year} م`
    : `${monthName(month, locale)} (${month}) ${year}`;
}
