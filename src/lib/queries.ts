import "server-only";

import {
  channelTotals,
  expenseByCategory,
  monthlySeries,
  settlementRows,
  settlementSummary,
  type ChannelTotal,
  type CategoryTotal,
  type SettlementSummary,
} from "@/lib/analytics";
import { store, tenantStore, type Store } from "@/lib/store";
import type { TenantContext } from "@/lib/db/tenant";
import type {
  BuildingRecord,
  ContractRecord,
  ExpenseRecord,
  MonthlyPoint,
  RevenueRecord,
  UnitRecord,
  UnitSettlement,
  UtilityBillRecord,
} from "@/lib/types";

export const CURRENT_YEAR = 2026;
export const CURRENT_MONTH = 8;
export const FISCAL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8];

export type BuildingSnapshot = {
  building: BuildingRecord;
  units: UnitRecord[];
  monthRevenues: RevenueRecord[];
  monthExpenses: ExpenseRecord[];
  monthBills: UtilityBillRecord[];
  yearRevenues: RevenueRecord[];
  yearExpenses: ExpenseRecord[];
  contracts: ContractRecord[];
  settlement: UnitSettlement[];
  settlementSummary: SettlementSummary;
  monthly: MonthlyPoint[];
  channels: ChannelTotal[];
  categories: CategoryTotal[];
  monthRevenueTotal: number;
  monthExpenseTotal: number;
  monthBillTotal: number;
  monthPowerTotal: number;
  net: number;
};

async function buildSnapshot(
  data: Store,
  buildingId: string,
  year: number,
  month: number,
): Promise<BuildingSnapshot | null> {
  const building = await data.getBuilding(buildingId);
  if (!building) return null;

  const [units, monthRevenues, monthExpenses, monthBills, yearRevenues, yearExpenses, contracts] =
    await Promise.all([
      data.listUnits(buildingId),
      data.listRevenues(buildingId, year, month),
      data.listExpenses(buildingId, year, month),
      data.listUtilityBills(buildingId, year, month),
      data.listRevenues(buildingId, year),
      data.listExpenses(buildingId, year),
      data.listContracts(buildingId),
    ]);

  const settlement = settlementRows(units, yearRevenues, year);
  const monthRevenueTotal = monthRevenues.reduce((sum, row) => sum + row.amount, 0);
  const monthExpenseTotal = monthExpenses.reduce((sum, row) => sum + row.amount, 0);
  const monthBillTotal = monthBills.reduce((sum, row) => sum + row.amount, 0);
  const monthPowerTotal = monthBills
    .filter((bill) => bill.type.includes("كهرباء"))
    .reduce((sum, bill) => sum + bill.amount, 0);

  return {
    building,
    units,
    monthRevenues,
    monthExpenses,
    monthBills,
    yearRevenues,
    yearExpenses,
    contracts,
    settlement,
    settlementSummary: settlementSummary(settlement),
    monthly: monthlySeries(yearRevenues, yearExpenses, year, FISCAL_MONTHS),
    channels: channelTotals(monthRevenues),
    categories: expenseByCategory(monthExpenses),
    monthRevenueTotal: Math.round(monthRevenueTotal * 100) / 100,
    monthExpenseTotal: Math.round(monthExpenseTotal * 100) / 100,
    monthBillTotal: Math.round(monthBillTotal * 100) / 100,
    monthPowerTotal: Math.round(monthPowerTotal * 100) / 100,
    net: Math.round((monthRevenueTotal - monthExpenseTotal) * 100) / 100,
  };
}

export async function loadBuildingSnapshot(
  context: TenantContext,
  buildingId: string,
  year = CURRENT_YEAR,
  month = CURRENT_MONTH,
): Promise<BuildingSnapshot | null> {
  return buildSnapshot(tenantStore(context), buildingId, year, month);
}

/**
 * Snapshot for a signed public link. The token is the authorization here, so
 * the read runs with the owner connection instead of a user identity.
 */
export async function loadPublicBuildingSnapshot(
  buildingId: string,
  year = CURRENT_YEAR,
  month = CURRENT_MONTH,
): Promise<BuildingSnapshot | null> {
  return buildSnapshot(store(), buildingId, year, month);
}

export async function loadAllSnapshots(
  context: TenantContext,
  year = CURRENT_YEAR,
  month = CURRENT_MONTH,
): Promise<BuildingSnapshot[]> {
  const data = tenantStore(context);
  const buildings = await data.listBuildings();
  const snapshots = await Promise.all(
    buildings.map((building) => buildSnapshot(data, building.id, year, month)),
  );
  return snapshots.filter((snapshot): snapshot is BuildingSnapshot => snapshot !== null);
}
