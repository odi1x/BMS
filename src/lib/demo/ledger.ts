import type {
  ContractRecord,
  ExpenseRecord,
  PaymentChannel,
  RevenueRecord,
  UtilityBillRecord,
} from "@/lib/types";
import { MONTHS, NOOR_ID, WAFAA_ID, YEAR, YASMIN_ID } from "./units";

const DAY = 24 * 60 * 60 * 1000;

function date(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/* ------------------------------------------------------------------ *
 * برج الوفاء · أغسطس 2026: سندات القبض كما وردت في مواصفات المنتج
 * ------------------------------------------------------------------ */

type AugustVoucher = {
  voucherNo: string;
  day: number;
  unitNumber: string;
  amount: number;
  channel: PaymentChannel;
  notes: string;
};

const WAFAA_AUGUST_VOUCHERS: AugustVoucher[] = [
  { voucherNo: "41", day: 1, unitNumber: "9", amount: 1500, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (9)" },
  { voucherNo: "42", day: 2, unitNumber: "34", amount: 1500, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (34)" },
  { voucherNo: "43", day: 4, unitNumber: "39", amount: 1500, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (39)" },
  { voucherNo: "44", day: 5, unitNumber: "58", amount: 1500, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (58)" },
  { voucherNo: "45", day: 8, unitNumber: "66", amount: 1500, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (66)" },
  { voucherNo: "46", day: 10, unitNumber: "5", amount: 1500, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (5)" },
  { voucherNo: "47", day: 11, unitNumber: "12", amount: 1800, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (12)" },
  { voucherNo: "48", day: 12, unitNumber: "14", amount: 1800, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (14)" },
  { voucherNo: "49", day: 13, unitNumber: "35", amount: 1800, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (35)" },
  { voucherNo: "50", day: 16, unitNumber: "45", amount: 1800, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (45)" },
  { voucherNo: "51", day: 18, unitNumber: "63", amount: 1800, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (63)" },
  { voucherNo: "52", day: 19, unitNumber: "24", amount: 2400, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (24)" },
  { voucherNo: "53", day: 20, unitNumber: "29", amount: 2400, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (29)" },
  { voucherNo: "54", day: 22, unitNumber: "31", amount: 2400, channel: "BANK_TRANSFER", notes: "رسوم خدمات وماء - شقة رقم (31)" },
  { voucherNo: "55", day: 23, unitNumber: "47", amount: 2400, channel: "CASH", notes: "رسوم خدمات البرج - شقة رقم (47)" },
  { voucherNo: "56", day: 24, unitNumber: "51", amount: 2400, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (51)" },
  { voucherNo: "57", day: 26, unitNumber: "71", amount: 3000, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (71)" },
  { voucherNo: "58", day: 27, unitNumber: "27 + 136", amount: 2400, channel: "BANK_TRANSFER", notes: "رسوم خدمات البرج - شقة رقم (27 + 136)" },
  { voucherNo: "59", day: 28, unitNumber: "51", amount: 1000, channel: "CASH", notes: "كرت للمواقف شقة رقم (51)" },
  { voucherNo: "60", day: 29, unitNumber: "71", amount: 1000, channel: "OTHER", notes: "كرت للمواقف شقة رقم (71)" },
];

/** January–July collection plan for برج الوفاء (28 unit payments). */
const WAFAA_EARLY_PLAN: Array<[unitNumber: string, month: number, day: number]> = [
  ["8", 1, 6], ["15", 1, 9], ["18", 1, 13], ["21", 1, 16], ["53", 1, 20], ["60", 1, 23], ["68", 1, 27],
  ["74", 2, 3], ["77", 2, 7], ["81", 2, 12], ["84", 2, 17], ["88", 2, 24],
  ["92", 3, 4], ["95", 3, 9], ["98", 3, 15], ["101", 3, 21],
  ["106", 4, 5], ["110", 4, 11], ["112", 4, 19],
  ["115", 5, 6], ["118", 5, 12], ["121", 5, 26],
  ["124", 6, 8], ["127", 6, 18], ["130", 6, 25],
  ["133", 7, 7], ["136", 7, 17], ["139", 7, 28],
];

/** رقم السند الشهري_sequence: يناير يبدأ من 13 بعد سندات ديسمبر 2025 (1–12). */
const WAFAA_EARLY_VOUCHER_START = 13;

function channelFor(index: number): PaymentChannel {
  const pattern: PaymentChannel[] = ["BANK_TRANSFER", "CASH", "BANK_TRANSFER", "BANK_TRANSFER", "CASH"];
  return pattern[index % pattern.length];
}

export function buildWafaaRevenues(unitIdByNumber: Map<string, string>): RevenueRecord[] {
  const rows: RevenueRecord[] = [];
  let voucher = WAFAA_EARLY_VOUCHER_START;

  for (const [index, [unitNumber, month, day]] of WAFAA_EARLY_PLAN.entries()) {
    const unitId = unitIdByNumber.get(unitNumber);
    if (!unitId) continue;
    rows.push({
      id: `rev-wafaa-${voucher}`,
      buildingId: WAFAA_ID,
      unitId,
      voucherNo: String(voucher),
      date: date(YEAR, month, day),
      fiscalYear: YEAR,
      fiscalMonth: month,
      amount: 0, // filled by the caller that knows the unit fee
      paymentChannel: channelFor(index),
      notes: `رسوم خدمات البرج - شقة رقم (${unitNumber})`,
      createdAt: date(YEAR, month, day),
    } as RevenueRecord);
    voucher += 1;
  }

  for (const row of WAFAA_AUGUST_VOUCHERS) {
    rows.push({
      id: `rev-wafaa-${row.voucherNo}`,
      buildingId: WAFAA_ID,
      unitId: unitIdByNumber.get(row.unitNumber) ?? null,
      voucherNo: row.voucherNo,
      date: date(YEAR, 8, row.day),
      fiscalYear: YEAR,
      fiscalMonth: 8,
      amount: row.amount,
      paymentChannel: row.channel,
      notes: row.notes,
      createdAt: date(YEAR, 8, row.day),
    });
  }

  return rows;
}

/** يملأ مبالغ السندات المبكرة بقيمة الرسوم السنوية للشقة. */
export function fillEarlyAmounts(
  rows: RevenueRecord[],
  annualFeeByUnitId: Map<string, number>,
): void {
  for (const row of rows) {
    if (row.fiscalMonth === 8) continue;
    row.amount = row.unitId ? (annualFeeByUnitId.get(row.unitId) ?? 0) : 0;
  }
}

/* ------------------------------------------------------------------ *
 * برج النور وعمارة الياسمين · إيرادات موزعة على السنة
 * ------------------------------------------------------------------ */

const NOOR_MONTHS = [
  1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8,
];
const YASMIN_MONTHS = [1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 8];

export function buildTowerRevenues(
  buildingId: string,
  units: Array<{ id: string; unitNumber: string; annualFee: number }>,
  monthPlan: number[],
): RevenueRecord[] {
  const rows: RevenueRecord[] = [];
  let voucher = 1;

  units.forEach((unit, index) => {
    // آخر وحدة في كل برج لم تسدد رسم الخدمة السنوي بعد.
    if (index === units.length - 1) return;
    const month = monthPlan[index] ?? 1;
    const day = 2 + ((index * 7) % 24);
    rows.push({
      id: `rev-${buildingId}-${voucher}`,
      buildingId,
      unitId: unit.id,
      voucherNo: String(voucher),
      date: date(YEAR, month, day),
      fiscalYear: YEAR,
      fiscalMonth: month,
      amount: unit.annualFee,
      paymentChannel: channelFor(index),
      notes: `رسوم خدمات البرج - شقة رقم (${unit.unitNumber})`,
      createdAt: date(YEAR, month, day),
    });
    voucher += 1;
  });

  return rows;
}

/* ------------------------------------------------------------------ *
 * المصروفات
 * ------------------------------------------------------------------ */

type ExpenseSeed = {
  category: string;
  amount: number;
  notes: string;
};

const WAFAA_EXPENSE_LINES: ExpenseSeed[] = [
  { category: "فواتير الاتصالات والنت", amount: 299.0, notes: "اشتراك الإنترنت والراوتر - شهر أغسطس" },
  { category: "فواتير الكهرباء", amount: 3581.2, notes: "العدّاد أ (2,072.81) والعدّاد ب (1,508.39)" },
  { category: "فاتورة شركة المياه", amount: 748.04, notes: "فاتورة شركة المياه الوطنية" },
  { category: "عقد النظافة والإشراف على البرج", amount: 5900.0, notes: "أتعاب شهرية ثابتة" },
  { category: "عقد صيانة المصاعد", amount: 0.0, notes: "إجمالي العقد 14,000 ر.س لـ 7 مصاعد - القسط المستحق 1/7/2026 غير مسدد" },
  { category: "إصلاح وقطع الغيار للمصاعد", amount: 1800.0, notes: "أجور صيانة طارئة وقطع غيار" },
  { category: "أدوات النظافة", amount: 621.31, notes: "مستلزمات وصابون" },
  { category: "إصلاحات السباكة وأدواتها", amount: 1958.0, notes: "وصلات وصمامات وصيانة المياه" },
  { category: "إصلاحات الكهرباء وأدواتها", amount: 1350.0, notes: "قواطع وإضاءة وتمديدات" },
  { category: "الترميم", amount: 480.0, notes: "دهان وأعمال بناء بسيطة" },
  { category: "الرواتب", amount: 7000.0, notes: "رواتب الحارس والعمالة الشهرية" },
  { category: "أخرى (النثريات)", amount: 231.5, notes: "مصروفات نثرية غير مصنفة" },
];

/** مصروفات برج الوفاء من يناير إلى يوليو: [كهرباء، مياه، مصاعد، نظافة، سباكة، كهرباء، ترميم، نثرية] */
const WAFAA_EARLY_EXPENSES: Record<number, [number, number, number, number, number, number, number, number]> = {
  1: [3420.55, 812.3, 0, 640.25, 1220, 980, 350, 180],
  2: [3118.4, 704.15, 2450, 592.4, 1875.5, 1240, 720, 265.75],
  3: [2884.1, 648.9, 0, 705.6, 1430, 1105, 480, 142.2],
  4: [2476.95, 582.4, 1950, 566.15, 2110.75, 860, 640, 198.3],
  5: [2150.3, 526.7, 0, 610.85, 1690, 1320, 395, 156.45],
  6: [1980.6, 498.2, 3200, 588.4, 1845.6, 1015, 810, 174.8],
  7: [1744.25, 455.6, 0, 634.7, 1980, 740, 425, 132.6],
};

export function buildWafaaExpenses(): ExpenseRecord[] {
  const rows: ExpenseRecord[] = [];

  for (const month of MONTHS) {
    if (month === 8) {
      WAFAA_EXPENSE_LINES.forEach((line, index) => {
        rows.push({
          id: `exp-wafaa-${month}-${index + 1}`,
          buildingId: WAFAA_ID,
          itemNo: index + 1,
          category: line.category,
          amount: line.amount,
          fiscalYear: YEAR,
          fiscalMonth: month,
          notes: line.notes,
          createdAt: date(YEAR, month, 31),
        });
      });
      continue;
    }

    const [power, water, elevators, supplies, plumbing, electrical, restoration, misc] =
      WAFAA_EARLY_EXPENSES[month];
    const lines: ExpenseSeed[] = [
      { category: "فواتير الاتصالات والنت", amount: 299, notes: "اشتراك الإنترنت والراوتر" },
      { category: "فواتير الكهرباء", amount: power, notes: "فاتورتا العدّاد أ والعدّاد ب" },
      { category: "فاتورة شركة المياه", amount: water, notes: "فاتورة شركة المياه الوطنية" },
      { category: "عقد النظافة والإشراف على البرج", amount: 5900, notes: "أتعاب شهرية ثابتة" },
      {
        category: "عقد صيانة المصاعد",
        amount: 1000,
        notes: "قسط شهري من عقد صيانة 7 مصاعد (إجمالي 14,000 ر.س)",
      },
      { category: "إصلاح وقطع الغيار للمصاعد", amount: elevators, notes: "صيانة وقطع غيار المصاعد" },
      { category: "أدوات النظافة", amount: supplies, notes: "مستلزمات وصابون" },
      { category: "إصلاحات السباكة وأدواتها", amount: plumbing, notes: "وصلات وصمامات وصيانة المياه" },
      { category: "إصلاحات الكهرباء وأدواتها", amount: electrical, notes: "قواطع وإضاءة وتمديدات" },
      { category: "الترميم", amount: restoration, notes: "دهان وأعمال بناء بسيطة" },
      { category: "الرواتب", amount: 7000, notes: "رواتب الحارس والعمالة الشهرية" },
      { category: "أخرى (النثريات)", amount: misc, notes: "مصروفات نثرية غير مصنفة" },
    ];

    lines.forEach((line, index) => {
      rows.push({
        id: `exp-wafaa-${month}-${index + 1}`,
        buildingId: WAFAA_ID,
        itemNo: index + 1,
        category: line.category,
        amount: line.amount,
        fiscalYear: YEAR,
        fiscalMonth: month,
        notes: line.notes,
        createdAt: date(YEAR, month, 28),
      });
    });
  }

  return rows;
}

type TowerExpenseProfile = {
  telecom: number;
  power: number;
  water: number;
  cleaning: number;
  elevators: number;
  payroll: number;
  repairs: number[];
};

const NOOR_PROFILE: TowerExpenseProfile = {
  telecom: 299,
  power: 2410.4,
  water: 612.3,
  cleaning: 3200,
  elevators: 800,
  payroll: 4500,
  repairs: [980, 1240, 760, 1580, 890],
};

const YASMIN_PROFILE: TowerExpenseProfile = {
  telecom: 199,
  power: 1320.75,
  water: 386.4,
  cleaning: 1800,
  elevators: 500,
  payroll: 2600,
  repairs: [420, 680, 910, 350],
};

export function buildTowerExpenses(
  buildingId: string,
  profile: TowerExpenseProfile,
  salt: number,
): ExpenseRecord[] {
  const rows: ExpenseRecord[] = [];

  for (const month of MONTHS) {
    const repair = profile.repairs[(month + salt) % profile.repairs.length];
    const lines: ExpenseSeed[] = [
      { category: "فواتير الاتصالات والنت", amount: profile.telecom, notes: "اشتراك الإنترنت" },
      { category: "فواتير الكهرباء", amount: profile.power, notes: "فاتورة الكهرباء الشهرية" },
      { category: "فاتورة شركة المياه", amount: profile.water, notes: "فاتورة شركة المياه الوطنية" },
      { category: "عقد النظافة والإشراف", amount: profile.cleaning, notes: "أتعاب شهرية ثابتة" },
      {
        category: "عقد صيانة المصاعد",
        amount: month === 7 || month === 8 ? 0 : profile.elevators,
        notes: "قسط شهري من عقد صيانة المصاعد",
      },
      { category: "إصلاح وقطع غيار", amount: repair, notes: "صيانة دورية" },
      { category: "أدوات النظافة", amount: 420 + salt * 13, notes: "مستلزمات وصابون" },
      { category: "إصلاحات السباكة وأدواتها", amount: 760 + salt * 41, notes: "وصلات وصمامات" },
      { category: "إصلاحات الكهرباء وأدواتها", amount: 540 + salt * 29, notes: "قواطع وإضاءة" },
      { category: "الترميم", amount: 320 + salt * 17, notes: "دهان وأعمال بناء بسيطة" },
      { category: "الرواتب", amount: profile.payroll, notes: "رواتب الحارس والعمالة الشهرية" },
      { category: "أخرى (النثريات)", amount: 180 + salt * 7, notes: "مصروفات نثرية" },
    ];

    lines.forEach((line, index) => {
      rows.push({
        id: `exp-${buildingId}-${month}-${index + 1}`,
        buildingId,
        itemNo: index + 1,
        category: line.category,
        amount: line.amount,
        fiscalYear: YEAR,
        fiscalMonth: month,
        notes: line.notes,
        createdAt: date(YEAR, month, 28),
      });
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ *
 * فواتير الخدمات
 * ------------------------------------------------------------------ */

type BillSeed = {
  type: string;
  accountNo: string;
  meterNo: string | null;
  amount: number;
  day: number;
};

const WAFAA_BILLS: BillSeed[] = [
  { type: "الاتصالات والإنترنت", accountNo: "1821913005", meterNo: null, amount: 299, day: 31 },
  {
    type: "عداد كهرباء للبرج (أ)",
    accountNo: "HLY2020627038687",
    meterNo: "30126175787",
    amount: 2072.81,
    day: 31,
  },
  {
    type: "عداد كهرباء للبرج (ب)",
    accountNo: "SXE2020627057317",
    meterNo: "30126175722",
    amount: 1508.39,
    day: 31,
  },
  { type: "شركة المياه الوطنية", accountNo: "5651641486", meterNo: null, amount: 748.04, day: 5 },
];

export function buildWafaaBills(): UtilityBillRecord[] {
  const rows: UtilityBillRecord[] = [];

  for (const month of MONTHS) {
    const [power] = WAFAA_EARLY_EXPENSES[month] ?? [0, 0, 0, 0, 0, 0, 0, 0];
    const powerA = Math.round(power * 0.578 * 100) / 100;
    const powerB = Math.round((power - powerA) * 100) / 100;
    const water = WAFAA_EARLY_EXPENSES[month]?.[1] ?? 0;

    const seeds: BillSeed[] =
      month === 8
        ? WAFAA_BILLS
        : [
            { type: "الاتصالات والإنترنت", accountNo: "1821913005", meterNo: null, amount: 299, day: 28 },
            {
              type: "عداد كهرباء للبرج (أ)",
              accountNo: "HLY2020627038687",
              meterNo: "30126175787",
              amount: powerA,
              day: 28,
            },
            {
              type: "عداد كهرباء للبرج (ب)",
              accountNo: "SXE2020627057317",
              meterNo: "30126175722",
              amount: powerB,
              day: 28,
            },
            { type: "شركة المياه الوطنية", accountNo: "5651641486", meterNo: null, amount: water, day: 5 },
          ];

    seeds.forEach((seed, index) => {
      rows.push({
        id: `bill-wafaa-${month}-${index + 1}`,
        buildingId: WAFAA_ID,
        type: seed.type,
        accountNo: seed.accountNo,
        meterNo: seed.meterNo,
        amount: seed.amount,
        paymentDate: date(YEAR, month, seed.day),
        fiscalYear: YEAR,
        fiscalMonth: month,
      });
    });
  }

  return rows;
}

export function buildTowerBills(
  buildingId: string,
  profile: { telecom: number; power: number; water: number },
  accounts: { telecom: string; powerA: string; powerB: string; water: string },
): UtilityBillRecord[] {
  const rows: UtilityBillRecord[] = [];

  for (const month of MONTHS) {
    const powerA = Math.round(profile.power * 0.58 * 100) / 100;
    const powerB = Math.round((profile.power - powerA) * 100) / 100;
    const seeds: BillSeed[] = [
      { type: "الاتصالات والإنترنت", accountNo: accounts.telecom, meterNo: null, amount: profile.telecom, day: 28 },
      { type: "عداد كهرباء للبرج (أ)", accountNo: accounts.powerA, meterNo: null, amount: powerA, day: 28 },
      { type: "عداد كهرباء للبرج (ب)", accountNo: accounts.powerB, meterNo: null, amount: powerB, day: 28 },
      { type: "شركة المياه الوطنية", accountNo: accounts.water, meterNo: null, amount: profile.water, day: 5 },
    ];

    seeds.forEach((seed, index) => {
      rows.push({
        id: `bill-${buildingId}-${month}-${index + 1}`,
        buildingId,
        type: seed.type,
        accountNo: seed.accountNo,
        meterNo: seed.meterNo,
        amount: seed.amount,
        paymentDate: date(YEAR, month, seed.day),
        fiscalYear: YEAR,
        fiscalMonth: month,
      });
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ *
 * العقود
 * ------------------------------------------------------------------ */

export function buildContracts(): ContractRecord[] {
  return [
    {
      id: "ctr-wafaa-elevators",
      buildingId: WAFAA_ID,
      title: "عقد صيانة المصاعد",
      totalAmount: 14000,
      itemCount: 7,
      startDate: date(YEAR, 1, 1),
      endDate: date(YEAR + 1, 1, 1),
      nextDueDate: date(YEAR, 7, 1),
      balanceDue: 8000,
      vendor: "شركة المصاعد العربية للخدمات",
      paidAmount: 6000,
      installment: 1000,
      paymentNote: "تم سداد 6 أقساط (يناير–يونيو). قسط 1 يوليو 2026 غير مسدد.",
    },
    {
      id: "ctr-wafaa-cleaning",
      buildingId: WAFAA_ID,
      title: "عقد النظافة والإشراف على البرج",
      totalAmount: 70800,
      itemCount: null,
      startDate: date(YEAR, 1, 1),
      endDate: date(YEAR, 12, 31),
      nextDueDate: date(YEAR, 9, 1),
      balanceDue: 23600,
      vendor: "مؤسسة البشائر للخدمات العامة",
      paidAmount: 47200,
      installment: 5900,
      paymentNote: "أتعاب شهرية 5,900 ر.س مسددة حتى أغسطس 2026.",
    },
    {
      id: "ctr-noor-elevators",
      buildingId: NOOR_ID,
      title: "عقد صيانة المصاعد",
      totalAmount: 9600,
      itemCount: 4,
      startDate: date(YEAR, 1, 1),
      endDate: date(YEAR, 12, 31),
      nextDueDate: date(YEAR, 8, 1),
      balanceDue: 4000,
      vendor: "مؤسسة روافد للصيانة",
      paidAmount: 5600,
      installment: 800,
      paymentNote: "قسط أغسطس 2026 مستحق ولم يُسدد.",
    },
    {
      id: "ctr-noor-security",
      buildingId: NOOR_ID,
      title: "عقد الأمن والحراسة",
      totalAmount: 36000,
      itemCount: null,
      startDate: date(YEAR, 1, 1),
      endDate: date(YEAR, 12, 31),
      nextDueDate: date(YEAR, 9, 1),
      balanceDue: 12000,
      vendor: "شركة الحارس للأمن",
      paidAmount: 24000,
      installment: 3000,
      paymentNote: "دفعات شهرية 3,000 ر.س.",
    },
    {
      id: "ctr-yasmin-elevators",
      buildingId: YASMIN_ID,
      title: "عقد صيانة المصاعد",
      totalAmount: 6000,
      itemCount: 2,
      startDate: date(YEAR, 1, 1),
      endDate: date(YEAR, 12, 31),
      nextDueDate: date(YEAR, 8, 1),
      balanceDue: 2500,
      vendor: "مؤسسة روافد للصيانة",
      paidAmount: 3500,
      installment: 500,
      paymentNote: "قسط أغسطس 2026 مستحق ولم يُسدد.",
    },
  ];
}

export { DAY, date, NOOR_PROFILE, YASMIN_PROFILE, NOOR_MONTHS, YASMIN_MONTHS };
