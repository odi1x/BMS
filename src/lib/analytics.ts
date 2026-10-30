import { round2 } from "@/lib/format";
import type {
  ExpenseRecord,
  MonthlyPoint,
  PaymentChannel,
  RevenueRecord,
  UnitRecord,
  UnitSettlement,
} from "@/lib/types";

export function sumBy<T>(rows: T[], get: (row: T) => number): number {
  return round2(rows.reduce((total, row) => total + get(row), 0));
}

export type SettlementSummary = {
  units: number;
  paid: number;
  partial: number;
  unpaid: number;
  required: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
};

/** مطابقة التحصيل per unit مع الرسوم السنوية المستحقة. */
export function settlementRows(
  units: UnitRecord[],
  revenues: RevenueRecord[],
  year: number,
): UnitSettlement[] {
  const collectedByUnit = new Map<string, { total: number; last: Date | null }>();

  for (const revenue of revenues) {
    if (revenue.fiscalYear !== year || !revenue.unitId) continue;
    const current = collectedByUnit.get(revenue.unitId) ?? { total: 0, last: null };
    current.total += revenue.amount;
    if (!current.last || revenue.date > current.last) current.last = revenue.date;
    collectedByUnit.set(revenue.unitId, current);
  }

  return units.map((unit) => {
    const required = round2(unit.annualFee + unit.additionalFees);
    const collected = round2(collectedByUnit.get(unit.id)?.total ?? 0);
    const outstanding = round2(Math.max(0, required - collected));
    const status: UnitSettlement["status"] =
      outstanding <= 0 ? "PAID" : collected > 0 ? "PARTIAL" : "UNPAID";

    return {
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      ownerName: unit.ownerName,
      annualFee: unit.annualFee,
      additionalFees: unit.additionalFees,
      required,
      collected,
      outstanding,
      status,
      lastPaymentDate: collectedByUnit.get(unit.id)?.last ?? null,
    };
  });
}

export function settlementSummary(rows: UnitSettlement[]): SettlementSummary {
  const required = sumBy(rows, (row) => row.required);
  const collected = sumBy(rows, (row) => row.collected);
  return {
    units: rows.length,
    paid: rows.filter((row) => row.status === "PAID").length,
    partial: rows.filter((row) => row.status === "PARTIAL").length,
    unpaid: rows.filter((row) => row.status === "UNPAID").length,
    required,
    collected,
    outstanding: sumBy(rows, (row) => row.outstanding),
    collectionRate: required === 0 ? 0 : Math.min(100, round2((collected / required) * 100)),
  };
}

export function monthlySeries(
  revenues: RevenueRecord[],
  expenses: ExpenseRecord[],
  year: number,
  months: number[],
): MonthlyPoint[] {
  return months.map((month) => {
    const revenue = sumBy(
      revenues.filter((row) => row.fiscalYear === year && row.fiscalMonth === month),
      (row) => row.amount,
    );
    const expense = sumBy(
      expenses.filter((row) => row.fiscalYear === year && row.fiscalMonth === month),
      (row) => row.amount,
    );
    return { month, label: String(month), revenue, expenses: expense, net: round2(revenue - expense) };
  });
}

export type ChannelTotal = {
  channel: PaymentChannel;
  amount: number;
  count: number;
  share: number;
};

export function channelTotals(revenues: RevenueRecord[]): ChannelTotal[] {
  const channels: PaymentChannel[] = ["BANK_TRANSFER", "CASH", "OTHER"];
  const total = sumBy(revenues, (row) => row.amount);

  return channels.map((channel) => {
    const rows = revenues.filter((row) => row.paymentChannel === channel);
    const amount = sumBy(rows, (row) => row.amount);
    return {
      channel,
      amount,
      count: rows.length,
      share: total === 0 ? 0 : round2((amount / total) * 100),
    };
  });
}

export type CategoryTotal = {
  category: string;
  amount: number;
  share: number;
};

export function expenseByCategory(expenses: ExpenseRecord[]): CategoryTotal[] {
  const total = sumBy(expenses, (row) => row.amount);
  const grouped = new Map<string, number>();

  for (const expense of expenses) {
    grouped.set(expense.category, round2((grouped.get(expense.category) ?? 0) + expense.amount));
  }

  return [...grouped.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: total === 0 ? 0 : round2((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function fiscalYears(revenues: RevenueRecord[], expenses: ExpenseRecord[]): number[] {
  const years = new Set<number>();
  for (const row of revenues) years.add(row.fiscalYear);
  for (const row of expenses) years.add(row.fiscalYear);
  return [...years].sort((a, b) => b - a);
}
