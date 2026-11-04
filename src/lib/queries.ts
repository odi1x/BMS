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
import { store, tenantStore, tenantStoreIn, type SnapshotBundle, type Store } from "@/lib/store";
import { withTenant, type TenantContext } from "@/lib/db/tenant";
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

function snapshotFromBundle(
  bundle: SnapshotBundle,
  year: number,
  month: number,
): BuildingSnapshot {
  const { building, units, yearRevenues, yearExpenses, yearBills, contracts } = bundle;

  const monthRevenues = yearRevenues.filter((row) => row.fiscalMonth === month);
  const monthExpenses = yearExpenses.filter((row) => row.fiscalMonth === month);
  const monthBills = yearBills.filter((row) => row.fiscalMonth === month);

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

async function buildSnapshot(
  data: Store,
  buildingId: string,
  year: number,
  month: number,
): Promise<BuildingSnapshot | null> {
  const bundle = await data.loadSnapshotBundle(buildingId, year);
  return bundle ? snapshotFromBundle(bundle, year, month) : null;
}

/**
 * The database sits behind a pooler in another region, so every query costs
 * hundreds of milliseconds. Switching tabs asks for the same snapshot over and
 * over, so it is kept for a short while and dropped as soon as something is
 * written.
 */
const SNAPSHOT_TTL_MS = 45_000;

type CacheEntry = { expires: number; value: BuildingSnapshot };
type ListingEntry = { expires: number; value: BuildingRecord[] };

const snapshotCache = new Map<string, CacheEntry>();
const listingCache = new Map<string, ListingEntry>();
const recordCache = new Map<string, { expires: number; value: BuildingRecord | null }>();
const allSnapshotsCache = new Map<string, { expires: number; value: BuildingSnapshot[] }>();
const pendingSnapshots = new Map<string, Promise<BuildingSnapshot | null>>();

function snapshotKey(
  context: TenantContext,
  buildingId: string,
  year: number,
  month: number,
): string {
  return `${context.id}:${context.role}:${buildingId}:${year}:${month}`;
}

/** Drops the cached snapshots of one association, or all of them. */
export function invalidateSnapshots(buildingId?: string): void {
  const matches = (key: string) =>
    buildingId === undefined || key.includes(`:${buildingId}:`);

  for (const key of snapshotCache.keys()) if (matches(key)) snapshotCache.delete(key);
  for (const key of pendingSnapshots.keys()) if (matches(key)) pendingSnapshots.delete(key);
  for (const key of recordCache.keys()) if (matches(key)) recordCache.delete(key);
  if (buildingId === undefined) listingCache.clear();
  allSnapshotsCache.clear();
}

/** One association, for the sidebar and the page headers. */
export async function loadBuildingRecord(
  context: TenantContext,
  buildingId: string,
): Promise<BuildingRecord | null> {
  const key = `${context.id}:${context.role}:${buildingId}:record`;
  const hit = recordCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const building = await tenantStore(context).getBuilding(buildingId);
  recordCache.set(key, { expires: Date.now() + SNAPSHOT_TTL_MS, value: building });
  return building;
}

/** Every association the caller may see. */
export async function loadBuildingList(context: TenantContext): Promise<BuildingRecord[]> {
  return cachedBuildings(context);
}

async function cachedSnapshot(
  context: TenantContext,
  buildingId: string,
  year: number,
  month: number,
): Promise<BuildingSnapshot | null> {
  const key = snapshotKey(context, buildingId, year, month);

  const hit = snapshotCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const pending = pendingSnapshots.get(key);
  if (pending) return pending;

  const promise = withTenant(context, (tx) =>
    buildSnapshot(tenantStoreIn(tx), buildingId, year, month),
  )
    .then((snapshot) => {
      if (snapshot) {
        snapshotCache.set(key, { expires: Date.now() + SNAPSHOT_TTL_MS, value: snapshot });
      }
      return snapshot;
    })
    .finally(() => {
      pendingSnapshots.delete(key);
    });

  pendingSnapshots.set(key, promise);
  return promise;
}

async function cachedBuildings(context: TenantContext): Promise<BuildingRecord[]> {
  const key = `${context.id}:${context.role}:buildings`;
  const hit = listingCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const buildings = await tenantStore(context).listBuildings();
  listingCache.set(key, { expires: Date.now() + SNAPSHOT_TTL_MS, value: buildings });
  return buildings;
}

export async function loadBuildingSnapshot(
  context: TenantContext,
  buildingId: string,
  year = CURRENT_YEAR,
  month = CURRENT_MONTH,
): Promise<BuildingSnapshot | null> {
  return cachedSnapshot(context, buildingId, year, month);
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
  const key = `${context.id}:${context.role}:all:${year}:${month}`;
  const hit = allSnapshotsCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const snapshots = await withTenant(context, async (tx) => {
    const bundles = await tenantStoreIn(tx).loadAllSnapshotBundles(year);
    return bundles.map((bundle) => snapshotFromBundle(bundle, year, month));
  });

  allSnapshotsCache.set(key, { expires: Date.now() + SNAPSHOT_TTL_MS, value: snapshots });
  return snapshots;
}
