import { escapeHtml, money } from "@/lib/templates/document";

export type EmailBuilding = {
  name: string;
  registrationNo: string | null;
  unifiedId: string | null;
  address: string | null;
  iban: string | null;
  chairmanName: string | null;
  stampUrl: string | null;
};

const CELL = `padding: 24px 28px;`;

function layout(content: string, direction: "rtl" | "ltr" = "rtl"): string {
  return `<!doctype html>
<html lang="ar" dir="${direction}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { margin: 0; padding: 0; background: #f2f1ee; }
  table { border-collapse: collapse; }
  .card { width: 100%; max-width: 620px; }
  @media only screen and (max-width: 620px) {
    .cell { padding: 18px 16px !important; }
    .stack { display: block !important; width: 100% !important; }
    h1 { font-size: 19px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f2f1ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table role="presentation" class="card" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #e3e3e6;border-radius:12px;overflow:hidden;">
          ${content}
        </table>
        <p style="margin:14px 0 0;font-size:11px;color:#8c8c93;">نظام إدارة البرج والجمعيات · رسالة آلية</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function header(building: EmailBuilding): string {
  const stamp = building.stampUrl
    ? `<img src="${escapeHtml(building.stampUrl)}" alt="" width="64" height="64" style="width:64px;height:64px;object-fit:contain;" />`
    : "";

  return `
  <tr>
    <td class="cell" style="${CELL}border-bottom:2px solid #17171a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;">
            <h1 style="margin:0;font-size:21px;line-height:1.35;font-weight:700;color:#17171a;">${escapeHtml(building.name)}</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#55555c;line-height:1.7;">
              رقم الجمعية: ${escapeHtml(building.registrationNo) || "·"} · الرقم الموحد: ${escapeHtml(building.unifiedId) || "·"}<br />
              ${escapeHtml(building.address)}
            </p>
          </td>
          <td width="72" align="left" style="vertical-align:top;">${stamp}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function statementEmailHtml(input: {
  building: EmailBuilding;
  monthLabel: string;
  year: number;
  revenue: number;
  expensesTotal: number;
  net: number;
  expenseRows: { itemNo: number; category: string; notes: string | null; amount: number }[];
  statementUrl: string;
}): string {
  const rows = input.expenseRows
    .map(
      (row) => `
      <tr>
        <td style="padding:7px 8px;border-bottom:1px solid #e3e3e6;font-size:12px;color:#8c8c93;" width="34">${row.itemNo}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e3e3e6;font-size:12.5px;color:#17171a;">${escapeHtml(row.category)}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e3e3e6;font-size:12px;color:#55555c;">${escapeHtml(row.notes)}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #e3e3e6;font-size:12.5px;color:#17171a;text-align:left;direction:ltr;white-space:nowrap;">${money(row.amount)}</td>
      </tr>`,
    )
    .join("");

  return layout(`
    ${header(input.building)}
    <tr>
      <td class="cell" style="${CELL}">
        <h2 style="margin:0 0 4px;font-size:17px;font-weight:700;color:#17171a;">التقرير المالي · ${input.monthLabel} ${input.year}</h2>
        <p style="margin:0 0 18px;font-size:12.5px;color:#55555c;">الرصيد المتوفر = إجمالي الإيرادات − إجمالي المصروفات</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e3e6;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="padding:12px 14px;width:33.33%;border-left:1px solid #e3e3e6;">
              <p style="margin:0;font-size:11.5px;color:#8c8c93;">إجمالي الإيرادات</p>
              <p style="margin:3px 0 0;font-size:16px;font-weight:700;color:#17171a;direction:ltr;text-align:right;">${money(input.revenue)} ر.س</p>
            </td>
            <td style="padding:12px 14px;width:33.33%;border-left:1px solid #e3e3e6;">
              <p style="margin:0;font-size:11.5px;color:#8c8c93;">إجمالي المصروفات</p>
              <p style="margin:3px 0 0;font-size:16px;font-weight:700;color:#17171a;direction:ltr;text-align:right;">${money(input.expensesTotal)} ر.س</p>
            </td>
            <td style="padding:12px 14px;width:33.33%;background:#f7f6f3;">
              <p style="margin:0;font-size:11.5px;color:#8c8c93;">الرصيد المتوفر</p>
              <p style="margin:3px 0 0;font-size:16px;font-weight:700;color:#007d50;direction:ltr;text-align:right;">${money(input.net)} ر.س</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
          <thead>
            <tr>
              <th style="padding:8px;background:#f7f6f3;font-size:11.5px;color:#3d3d43;text-align:right;">م</th>
              <th style="padding:8px;background:#f7f6f3;font-size:11.5px;color:#3d3d43;text-align:right;">البيان</th>
              <th style="padding:8px;background:#f7f6f3;font-size:11.5px;color:#3d3d43;text-align:right;">ملاحظات</th>
              <th style="padding:8px;background:#f7f6f3;font-size:11.5px;color:#3d3d43;text-align:left;">المبلغ (ر.س)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="margin:20px 0 0;">
          <a href="${escapeHtml(input.statementUrl)}" style="display:inline-block;padding:11px 18px;background:#17171a;color:#ffffff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">تحميل البيان (PDF)</a>
        </p>
      </td>
    </tr>
    <tr>
      <td class="cell" style="${CELL}border-top:1px solid #e3e3e6;background:#fafaf8;">
        <p style="margin:0;font-size:11.5px;color:#8c8c93;line-height:1.8;">
          ${input.building.chairmanName ? `${escapeHtml(input.building.chairmanName)} · رئيس الجمعية` : "رئيس الجمعية"}<br />
          ${input.building.iban ? `آيبان: ${escapeHtml(input.building.iban)}` : ""}
        </p>
      </td>
    </tr>`);
}

export function voucherEmailHtml(input: {
  building: EmailBuilding;
  voucherNo: string;
  payer: string;
  unitNumber: string | null;
  amount: number;
  amountWords: string;
  purpose: string | null;
  voucherUrl: string;
}): string {
  return layout(`
    ${header(input.building)}
    <tr>
      <td class="cell" style="${CELL}">
        <h2 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#17171a;">سند قبض · رقم ${escapeHtml(input.voucherNo)}</h2>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <th width="140" style="padding:8px 0;border-bottom:1px solid #e3e3e6;font-size:12px;color:#8c8c93;text-align:right;font-weight:500;">استلمنا من</th>
            <td style="padding:8px 0;border-bottom:1px solid #e3e3e6;font-size:13.5px;color:#17171a;">${escapeHtml(input.payer)}${input.unitNumber ? ` · شقة ${escapeHtml(input.unitNumber)}` : ""}</td>
          </tr>
          <tr>
            <th style="padding:8px 0;border-bottom:1px solid #e3e3e6;font-size:12px;color:#8c8c93;text-align:right;font-weight:500;">المبلغ كتابةً</th>
            <td style="padding:8px 0;border-bottom:1px solid #e3e3e6;font-size:13.5px;color:#17171a;">${escapeHtml(input.amountWords)}</td>
          </tr>
          <tr>
            <th style="padding:8px 0;border-bottom:1px solid #e3e3e6;font-size:12px;color:#8c8c93;text-align:right;font-weight:500;">المبلغ</th>
            <td style="padding:8px 0;border-bottom:1px solid #e3e3e6;font-size:15px;font-weight:700;color:#17171a;direction:ltr;text-align:right;">${money(input.amount)} ر.س</td>
          </tr>
          <tr>
            <th style="padding:8px 0;font-size:12px;color:#8c8c93;text-align:right;font-weight:500;">مقابل</th>
            <td style="padding:8px 0;font-size:13px;color:#17171a;">${escapeHtml(input.purpose) || "·"}</td>
          </tr>
        </table>

        <p style="margin:22px 0 0;">
          <a href="${escapeHtml(input.voucherUrl)}" style="display:inline-block;padding:11px 18px;background:#17171a;color:#ffffff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">تحميل السند (PDF)</a>
        </p>
      </td>
    </tr>`);
}
