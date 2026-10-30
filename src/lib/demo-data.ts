import type {
  BuildingRecord,
  ContractRecord,
  ExpenseRecord,
  RevenueRecord,
  UserRecord,
  UtilityBillRecord,
} from "@/lib/types";
import {
  buildContracts,
  buildTowerBills,
  buildTowerExpenses,
  buildTowerRevenues,
  buildWafaaBills,
  buildWafaaExpenses,
  buildWafaaRevenues,
  fillEarlyAmounts,
  NOOR_MONTHS,
  NOOR_PROFILE,
  YASMIN_MONTHS,
  YASMIN_PROFILE,
} from "./demo/ledger";
import { demoUnits, NOOR_ID, WAFAA_ID, YEAR, YASMIN_ID } from "./demo/units";

export { demoUnits };

export const demoBuildings: BuildingRecord[] = [
  {
    id: WAFAA_ID,
    name: "جمعية ملاك برج الوفاء السكني",
    registrationNo: "2423502100",
    unifiedId: "7051508831",
    address: "مكة المكرمة - العزيزية - طريق الطائف - بجوار المسجد القطري",
    iban: "SA8010000067700000562109",
    chairmanName: "جمال محمد المرزوقي",
    stampUrl: null,
    stampFileId: null,
  },
  {
    id: NOOR_ID,
    name: "جمعية ملاك برج النور السكني",
    registrationNo: "2423502187",
    unifiedId: "7051508942",
    address: "مكة المكرمة - العزيزية - شارع إبراهيم الخليل - بجوار السوق المركزي",
    iban: "SA4420000012345678901234",
    chairmanName: "عبد الله سعيد الغامدي",
    stampUrl: null,
    stampFileId: null,
  },
  {
    id: YASMIN_ID,
    name: "جمعية ملاك عمارة الياسمين",
    registrationNo: "3311200455",
    unifiedId: "7051507720",
    address: "جدة - حي الروضة - شارع الأمير سعود - مبنى 12",
    iban: "SA0380000000608010167519",
    chairmanName: "محمد عبد الله الشمري",
    stampUrl: null,
    stampFileId: null,
  },
];

export const demoUsers: UserRecord[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "admin@rentflow.sa",
    name: "إدارة النظام",
    passwordHash: null,
    avatarUrl: null,
    role: "ADMIN",
    buildingId: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "supervisor@rentflow.sa",
    name: "جمال محمد المرزوقي",
    passwordHash: null,
    avatarUrl: null,
    role: "USER",
    buildingId: WAFAA_ID,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    email: "noor@rentflow.sa",
    name: "عبد الله سعيد الغامدي",
    passwordHash: null,
    avatarUrl: null,
    role: "USER",
    buildingId: NOOR_ID,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    email: "yasmin@rentflow.sa",
    name: "محمد عبد الله الشمري",
    passwordHash: null,
    avatarUrl: null,
    role: "USER",
    buildingId: YASMIN_ID,
  },
];

const unitsByBuilding = (buildingId: string) =>
  demoUnits.filter((unit) => unit.buildingId === buildingId);

export const demoRevenues: RevenueRecord[] = (() => {
  const wafaaUnits = unitsByBuilding(WAFAA_ID);
  const unitIdByNumber = new Map(wafaaUnits.map((unit) => [unit.unitNumber, unit.id]));
  const annualFeeByUnitId = new Map(wafaaUnits.map((unit) => [unit.id, unit.annualFee]));

  const wafaa = buildWafaaRevenues(unitIdByNumber);
  fillEarlyAmounts(wafaa, annualFeeByUnitId);

  const noor = buildTowerRevenues(
    NOOR_ID,
    unitsByBuilding(NOOR_ID).map((unit) => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      annualFee: unit.annualFee,
    })),
    NOOR_MONTHS,
  );

  const yasmin = buildTowerRevenues(
    YASMIN_ID,
    unitsByBuilding(YASMIN_ID).map((unit) => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      annualFee: unit.annualFee,
    })),
    YASMIN_MONTHS,
  );

  return [...wafaa, ...noor, ...yasmin];
})();

export const demoExpenses: ExpenseRecord[] = [
  ...buildWafaaExpenses(),
  ...buildTowerExpenses(NOOR_ID, NOOR_PROFILE, 1),
  ...buildTowerExpenses(YASMIN_ID, YASMIN_PROFILE, 2),
];

export const demoUtilityBills: UtilityBillRecord[] = [
  ...buildWafaaBills(),
  ...buildTowerBills(
    NOOR_ID,
    { telecom: NOOR_PROFILE.telecom, power: NOOR_PROFILE.power, water: NOOR_PROFILE.water },
    {
      telecom: "1092834501",
      powerA: "HLY2020627045112",
      powerB: "SXE2020627061338",
      water: "5651649921",
    },
  ),
  ...buildTowerBills(
    YASMIN_ID,
    { telecom: YASMIN_PROFILE.telecom, power: YASMIN_PROFILE.power, water: YASMIN_PROFILE.water },
    {
      telecom: "1092887712",
      powerA: "HLY2020627048904",
      powerB: "SXE2020627066121",
      water: "5651643377",
    },
  ),
];

export const demoContracts: ContractRecord[] = buildContracts();

export type IntegrityCheck = { label: string; expected: number; actual: number; ok: boolean };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function revenueTotal(rows: RevenueRecord[], buildingId: string, month: number): number {
  return round2(
    rows
      .filter((row) => row.buildingId === buildingId && row.fiscalMonth === month)
      .reduce((sum, row) => sum + row.amount, 0),
  );
}

export function expenseTotal(rows: ExpenseRecord[], buildingId: string, month: number): number {
  return round2(
    rows
      .filter((row) => row.buildingId === buildingId && row.fiscalMonth === month)
      .reduce((sum, row) => sum + row.amount, 0),
  );
}

export function billTotal(rows: UtilityBillRecord[], buildingId: string, month: number): number {
  return round2(
    rows
      .filter((row) => row.buildingId === buildingId && row.fiscalMonth === month)
      .reduce((sum, row) => sum + row.amount, 0),
  );
}

/** تحقّق من تطابق الأرقام مع مواصفات المنتج قبل أي كتابة في قاعدة البيانات. */
export function integrityChecks(): IntegrityCheck[] {
  const checks: IntegrityCheck[] = [];
  const push = (label: string, expected: number, actual: number) =>
    checks.push({ label, expected, actual, ok: round2(expected) === round2(actual) });

  push("إجمالي إيرادات برج الوفاء · أغسطس 2026", 37400, revenueTotal(demoRevenues, WAFAA_ID, 8));
  push("إجمالي مصروفات برج الوفاء · أغسطس 2026", 23969.05, expenseTotal(demoExpenses, WAFAA_ID, 8));
  push(
    "إجمالي فواتير كهرباء برج الوفاء · أغسطس 2026",
    3581.2,
    round2(
      demoUtilityBills
        .filter((bill) => bill.buildingId === WAFAA_ID && bill.fiscalMonth === 8)
        .filter((bill) => bill.type.includes("كهرباء"))
        .reduce((sum, bill) => sum + bill.amount, 0),
    ),
  );
  push(
    "إجمالي فواتير الخدمات لبرج الوفاء · أغسطس 2026",
    4628.24,
    billTotal(demoUtilityBills, WAFAA_ID, 8),
  );
  push(
    "الرصيد المتوفر لبرج الوفاء · أغسطس 2026",
    13430.95,
    round2(revenueTotal(demoRevenues, WAFAA_ID, 8) - expenseTotal(demoExpenses, WAFAA_ID, 8)),
  );

  const wafaaUnits = unitsByBuilding(WAFAA_ID);
  const required = round2(
    wafaaUnits.reduce((sum, unit) => sum + unit.annualFee + unit.additionalFees, 0),
  );
  const collected = round2(
    demoRevenues
      .filter((row) => row.buildingId === WAFAA_ID)
      .reduce((sum, row) => sum + row.amount, 0),
  );
  push("إجمالي مستحقات رسوم برج الوفاء · 2026", 92300, required);
  push("إجمالي المحصّل من رسوم برج الوفاء · 2026", 87800, collected);
  push("المتأخرات في برج الوفاء · 2026", 4500, round2(required - collected));

  return checks;
}

export function assertIntegrity(): void {
  const failures = integrityChecks().filter((check) => !check.ok);
  if (failures.length > 0) {
    throw new Error(
      `فشل تحقّق سلامة البيانات التجريبية:\n${failures
        .map((check) => `- ${check.label}: المتوقع ${check.expected} والفعلي ${check.actual}`)
        .join("\n")}`,
    );
  }
}

export { WAFAA_ID, NOOR_ID, YASMIN_ID, YEAR };
