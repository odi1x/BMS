const ONES = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
];

const TEENS = [
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];

const TENS = [
  "",
  "",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];

const HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function under100(value: number): string {
  if (value < 10) return ONES[value];
  if (value < 20) return TEENS[value - 10];

  const tens = Math.floor(value / 10);
  const units = value % 10;
  if (units === 0) return TENS[tens];
  if (units === 1) return `واحد و${TENS[tens]}`;
  if (units === 2) return `اثنان و${TENS[tens]}`;
  return `${ONES[units]} و${TENS[tens]}`;
}

function under1000(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];

  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);
  if (rest > 0) parts.push(under100(rest));

  return parts.join(" و");
}

function scaleWord(value: number, singular: string, dual: string, plural: string, accusative: string): string {
  if (value === 1) return singular;
  if (value === 2) return dual;
  if (value <= 10) return `${ONES[value]} ${plural}`;
  return `${under1000(value)} ${accusative}`;
}

/** تحويل المبلغ إلى صيغة عربية كتابية: "فقط ألف وثمانمائة ريال سعودي لا غير". */
export function amountInArabicWords(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const halalas = Math.round((rounded - whole) * 100);

  const groups: string[] = [];
  let remaining = whole;

  const billions = Math.floor(remaining / 1_000_000_000);
  if (billions > 0) {
    groups.push(
      scaleWord(billions, "مليار", "ملياران", "مليارات", "ملياراً"),
    );
    remaining -= billions * 1_000_000_000;
  }

  const millions = Math.floor(remaining / 1_000_000);
  if (millions > 0) {
    groups.push(
      scaleWord(millions, "مليون", "مليونان", "ملايين", "مليوناً"),
    );
    remaining -= millions * 1_000_000;
  }

  const thousands = Math.floor(remaining / 1_000);
  if (thousands > 0) {
    groups.push(
      scaleWord(thousands, "ألف", "ألفان", "آلاف", "ألفاً"),
    );
    remaining -= thousands * 1_000;
  }

  if (remaining > 0) groups.push(under1000(remaining));

  const wholeWords = groups.length > 0 ? groups.join(" و") : "صفر";

  if (halalas === 0) {
    return `فقط ${wholeWords} ريال سعودي لا غير`;
  }

  const halalaWords =
    halalas === 100
      ? "مائة هللة"
      : `${under100(halalas)} هللة`;

  return `فقط ${wholeWords} ريال سعودي و${halalaWords} لا غير`;
}
