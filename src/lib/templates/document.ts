export type DocumentBuilding = {
  name: string;
  registrationNo: string | null;
  unifiedId: string | null;
  address: string | null;
  iban: string | null;
  chairmanName: string | null;
  stampUrl: string | null;
};

export type DocumentExpense = {
  itemNo: number;
  category: string;
  notes: string | null;
  amount: number;
};

const AMP = String.fromCharCode(38);

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, `${AMP}amp;`)
    .replace(/</g, `${AMP}lt;`)
    .replace(/>/g, `${AMP}gt;`)
    .replace(/"/g, `${AMP}quot;`)
    .replace(/'/g, `${AMP}#39;`);
}

export function money(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const BASE_CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16mm 14mm;
    font-family: "Segoe UI", "Noto Sans Arabic", "Tahoma", Arial, sans-serif;
    color: #17171a;
    background: #ffffff;
    font-size: 12.5px;
    line-height: 1.6;
  }
  .doc { direction: rtl; }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    border-bottom: 2px solid #17171a;
    padding-bottom: 12px;
  }
  .assoc-name { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
  .meta { color: #55555c; font-size: 11px; margin: 4px 0 0; }
  .stamp { width: 82px; height: 82px; object-fit: contain; }
  .stamp-box {
    width: 82px; height: 82px; border: 1px dashed #b8b8bd; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #8c8c93; font-size: 10px; text-align: center;
  }
  h1.title { font-size: 17px; margin: 20px 0 12px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 8px; border-bottom: 1px solid #e3e3e6; text-align: right; vertical-align: top; }
  th { background: #f7f6f3; font-weight: 600; font-size: 11.5px; color: #3d3d43; }
  td.num, th.num { direction: ltr; text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.muted { color: #55555c; font-size: 11.5px; }
  .balance { margin-top: 22px; max-width: 460px; }
  .balance td:last-child { font-weight: 700; }
  tr.total td { border-top: 1.5px solid #17171a; border-bottom: none; font-weight: 700; }
  .signatures {
    display: flex; justify-content: space-between; gap: 28px;
    margin-top: 44px; padding-top: 16px; border-top: 1px solid #e3e3e6;
  }
  .sig { flex: 1; }
  .sig .line { border-bottom: 1px solid #8c8c93; height: 38px; }
  .sig p { margin: 5px 0 0; font-size: 11px; color: #55555c; }
  .foot { margin-top: 22px; font-size: 10.5px; color: #8c8c93; display: flex; justify-content: space-between; }
  thead { display: table-header-group; }
  tr, .sig, .balance { break-inside: avoid; page-break-inside: avoid; }
  h1.title, .head { break-after: avoid; page-break-after: avoid; }
`;

export function documentShell(content: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>مستند</title>
<style>${BASE_CSS}</style>
</head>
<body><div class="doc">${content}</div></body>
</html>`;
}

export function statementHtml(input: {
  building: DocumentBuilding;
  monthLabel: string;
  month: number;
  year: number;
  hijriDate: string;
  gregorianDate: string;
  expenses: DocumentExpense[];
  revenue: number;
  expensesTotal: number;
  net: number;
}): string {
  const { building } = input;

  const stamp = building.stampUrl
    ? `<img class="stamp" src="${escapeHtml(building.stampUrl)}" alt="ختم الجمعية" />`
    : `<div class="stamp-box">ختم<br />الجمعية</div>`;

  const rows = input.expenses
    .map(
      (expense) => `
      <tr>
        <td class="num">${expense.itemNo}</td>
        <td>${escapeHtml(expense.category)}</td>
        <td class="muted">${escapeHtml(expense.notes)}</td>
        <td class="num">${money(expense.amount)}</td>
      </tr>`,
    )
    .join("");

  return documentShell(`
    <div class="head">
      <div>
        <p class="assoc-name">${escapeHtml(building.name)}</p>
        <p class="meta">رقم الجمعية: ${escapeHtml(building.registrationNo) || "·"} · الرقم الموحد: ${escapeHtml(building.unifiedId) || "·"}</p>
        <p class="meta">${escapeHtml(building.address)}</p>
      </div>
      ${stamp}
    </div>

    <h1 class="title">التقرير المالي لشهر ${escapeHtml(input.monthLabel)} ( ${input.month} ) للعام ${input.year} م</h1>

    <table>
      <thead>
        <tr>
          <th class="num" style="width: 42px;">م</th>
          <th style="width: 30%;">البيان</th>
          <th>ملاحظات</th>
          <th class="num" style="width: 110px;">المبلغ (ر.س)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="balance">
      <thead>
        <tr><th>ملخص الرصيد</th><th class="num">المبلغ (ر.س)</th></tr>
      </thead>
      <tbody>
        <tr><td>إجمالي الإيرادات</td><td class="num">${money(input.revenue)}</td></tr>
        <tr><td>إجمالي المصروفات</td><td class="num">${money(input.expensesTotal)}</td></tr>
        <tr class="total"><td>الرصيد المتوفر</td><td class="num">${money(input.net)}</td></tr>
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig">
        <div class="line"></div>
        <p>${escapeHtml(building.chairmanName)} · رئيس الجمعية</p>
      </div>
      <div class="sig">
        <div class="line"></div>
        <p>أمين الصندوق</p>
      </div>
      <div class="sig">
        <div class="line"></div>
        <p>المحاسب</p>
      </div>
    </div>

    <div class="foot">
      <span>آيبان الحساب: ${escapeHtml(building.iban) || "·"}</span>
      <span>التاريخ الهجري: ${escapeHtml(input.hijriDate)} · الموافق: ${escapeHtml(input.gregorianDate)}</span>
    </div>
  `);
}

export function voucherHtml(input: {
  building: DocumentBuilding;
  voucherNo: string;
  payer: string;
  unitNumber: string | null;
  amount: number;
  amountWords: string;
  purpose: string | null;
  channel: string;
  hijriDate: string;
  gregorianDate: string;
}): string {
  const { building } = input;

  const stamp = building.stampUrl
    ? `<img class="stamp" src="${escapeHtml(building.stampUrl)}" alt="ختم الجمعية" />`
    : `<div class="stamp-box">ختم<br />الجمعية</div>`;

  return documentShell(`
    <div class="head">
      <div>
        <p class="assoc-name">${escapeHtml(building.name)}</p>
        <p class="meta">رقم الجمعية: ${escapeHtml(building.registrationNo) || "·"} · الرقم الموحد: ${escapeHtml(building.unifiedId) || "·"}</p>
        <p class="meta">${escapeHtml(building.address)}</p>
      </div>
      ${stamp}
    </div>

    <h1 class="title">سند قبض · رقم ${escapeHtml(input.voucherNo)}</h1>

    <table>
      <tbody>
        <tr>
          <th style="width: 150px;">استلمنا من</th>
          <td>${escapeHtml(input.payer)}${input.unitNumber ? ` · شقة ${escapeHtml(input.unitNumber)}` : ""}</td>
        </tr>
        <tr>
          <th>المبلغ كتابةً</th>
          <td>${escapeHtml(input.amountWords)}</td>
        </tr>
        <tr>
          <th>المبلغ</th>
          <td class="num">${money(input.amount)} ر.س <span class="muted">(${escapeHtml(input.channel)})</span></td>
        </tr>
        <tr>
          <th>مقابل</th>
          <td>${escapeHtml(input.purpose) || "·"}</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig"><div class="line"></div><p>أمين الصندوق</p></div>
      <div class="sig"><div class="line"></div><p>رئيس الجمعية</p></div>
      <div class="sig"><div class="line"></div><p>ختم الجمعية</p></div>
    </div>

    <div class="foot">
      <span>${escapeHtml(building.name)}</span>
      <span>التاريخ الهجري: ${escapeHtml(input.hijriDate)} · الموافق: ${escapeHtml(input.gregorianDate)}</span>
    </div>
  `);
}
