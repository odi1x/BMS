import "server-only";

import type { Prisma } from "@prisma/client";
import { databaseConfigured, prisma } from "@/lib/db";
import { withTenant, type TenantContext } from "@/lib/db/tenant";
import {
  demoBuildings,
  demoContracts,
  demoExpenses,
  demoRevenues,
  demoUnits,
  demoUtilityBills,
  demoUsers,
} from "@/lib/demo-data";
import type {
  BuildingRecord,
  ContractRecord,
  ExpenseRecord,
  RevenueRecord,
  UnitRecord,
  UserRecord,
  UtilityBillRecord,
} from "@/lib/types";

export type SnapshotBundle = {
  building: BuildingRecord;
  units: UnitRecord[];
  yearRevenues: RevenueRecord[];
  yearExpenses: ExpenseRecord[];
  yearBills: UtilityBillRecord[];
  contracts: ContractRecord[];
};

export type Store = {
  listBuildings(): Promise<BuildingRecord[]>;
  getBuilding(id: string): Promise<BuildingRecord | null>;
  listUnits(buildingId: string): Promise<UnitRecord[]>;
  listRevenues(buildingId: string, year: number, month?: number): Promise<RevenueRecord[]>;
  getRevenue(buildingId: string, id: string): Promise<RevenueRecord | null>;
  listExpenses(buildingId: string, year: number, month?: number): Promise<ExpenseRecord[]>;
  listUtilityBills(buildingId: string, year: number, month?: number): Promise<UtilityBillRecord[]>;
  listContracts(buildingId: string): Promise<ContractRecord[]>;
  listUsers(): Promise<UserRecord[]>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  loadSnapshotBundle(buildingId: string, year: number): Promise<SnapshotBundle | null>;
  loadAllSnapshotBundles(year: number): Promise<SnapshotBundle[]>;
};

const snapshotInclude = (year: number) => ({
  units: { orderBy: [{ floor: "asc" as const }, { unitNumber: "asc" as const }] },
  revenues: {
    where: { fiscalYear: year },
    orderBy: [{ date: "asc" as const }, { voucherNo: "asc" as const }],
  },
  expenses: {
    where: { fiscalYear: year },
    orderBy: [{ fiscalMonth: "asc" as const }, { itemNo: "asc" as const }],
  },
  utilityBills: {
    where: { fiscalYear: year },
    orderBy: [{ paymentDate: "asc" as const }],
  },
  contracts: { orderBy: { startDate: "asc" as const } },
});

type SnapshotRow = Prisma.BuildingGetPayload<{ include: ReturnType<typeof snapshotInclude> }>;

function bundleOf(row: SnapshotRow): SnapshotBundle {
  const { units, revenues, expenses, utilityBills, contracts, ...building } = row;
  return {
    building,
    units,
    yearRevenues: revenues,
    yearExpenses: expenses,
    yearBills: utilityBills,
    contracts,
  };
}

const demoStore: Store = {
  async listBuildings() {
    return demoBuildings;
  },
  async getBuilding(id) {
    return demoBuildings.find((building) => building.id === id) ?? null;
  },
  async listUnits(buildingId) {
    return demoUnits.filter((unit) => unit.buildingId === buildingId);
  },
  async listRevenues(buildingId, year, month) {
    return demoRevenues.filter(
      (row) =>
        row.buildingId === buildingId &&
        row.fiscalYear === year &&
        (month === undefined || row.fiscalMonth === month),
    );
  },
  async getRevenue(buildingId, id) {
    return demoRevenues.find((row) => row.buildingId === buildingId && row.id === id) ?? null;
  },
  async listExpenses(buildingId, year, month) {
    return demoExpenses.filter(
      (row) =>
        row.buildingId === buildingId &&
        row.fiscalYear === year &&
        (month === undefined || row.fiscalMonth === month),
    );
  },
  async listUtilityBills(buildingId, year, month) {
    return demoUtilityBills.filter(
      (row) =>
        row.buildingId === buildingId &&
        row.fiscalYear === year &&
        (month === undefined || row.fiscalMonth === month),
    );
  },
  async listContracts(buildingId) {
    return demoContracts.filter((row) => row.buildingId === buildingId);
  },
  async listUsers() {
    return demoUsers;
  },
  async findUserByEmail(email) {
    return demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  async loadSnapshotBundle(buildingId, year) {
    const building = demoBuildings.find((entry) => entry.id === buildingId);
    if (!building) return null;
    return {
      building,
      units: demoUnits.filter((unit) => unit.buildingId === buildingId),
      yearRevenues: demoRevenues.filter(
        (row) => row.buildingId === buildingId && row.fiscalYear === year,
      ),
      yearExpenses: demoExpenses.filter(
        (row) => row.buildingId === buildingId && row.fiscalYear === year,
      ),
      yearBills: demoUtilityBills.filter(
        (row) => row.buildingId === buildingId && row.fiscalYear === year,
      ),
      contracts: demoContracts.filter((row) => row.buildingId === buildingId),
    };
  },
  async loadAllSnapshotBundles(year) {
    const bundles = await Promise.all(
      demoBuildings.map((building) => demoStore.loadSnapshotBundle(building.id, year)),
    );
    return bundles.filter((bundle): bundle is SnapshotBundle => bundle !== null);
  },
};

const prismaStore: Store = {
  async listBuildings() {
    return prisma.building.findMany({ orderBy: { createdAt: "asc" } });
  },
  async getBuilding(id) {
    return prisma.building.findUnique({ where: { id } });
  },
  async listUnits(buildingId) {
    return prisma.unit.findMany({
      where: { buildingId },
      orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
    });
  },
  async listRevenues(buildingId, year, month) {
    return prisma.revenue.findMany({
      where: {
        buildingId,
        fiscalYear: year,
        ...(month === undefined ? {} : { fiscalMonth: month }),
      },
      orderBy: [{ date: "asc" }, { voucherNo: "asc" }],
    });
  },
  async getRevenue(buildingId, id) {
    return prisma.revenue.findFirst({ where: { id, buildingId } });
  },
  async listExpenses(buildingId, year, month) {
    return prisma.expense.findMany({
      where: {
        buildingId,
        fiscalYear: year,
        ...(month === undefined ? {} : { fiscalMonth: month }),
      },
      orderBy: [{ fiscalMonth: "asc" }, { itemNo: "asc" }],
    });
  },
  async listUtilityBills(buildingId, year, month) {
    return prisma.utilityBill.findMany({
      where: {
        buildingId,
        fiscalYear: year,
        ...(month === undefined ? {} : { fiscalMonth: month }),
      },
      orderBy: [{ paymentDate: "asc" }],
    });
  },
  async listContracts(buildingId) {
    return prisma.contract.findMany({ where: { buildingId }, orderBy: { startDate: "asc" } });
  },
  async listUsers() {
    return prisma.profile.findMany({ orderBy: { name: "asc" } });
  },
  async findUserByEmail(email) {
    return prisma.profile.findUnique({ where: { email } });
  },
  async loadSnapshotBundle(buildingId, year) {
    const row = await prisma.building.findUnique({
      where: { id: buildingId },
      include: snapshotInclude(year),
    });
    return row ? bundleOf(row) : null;
  },
  async loadAllSnapshotBundles(year) {
    const rows = await prisma.building.findMany({
      orderBy: { createdAt: "asc" },
      include: snapshotInclude(year),
    });
    return rows.map(bundleOf);
  },
};

export function tenantStoreIn(tx: Prisma.TransactionClient): Store {
  return {
    async listBuildings() {
      return tx.building.findMany({ orderBy: { createdAt: "asc" } });
    },
    async getBuilding(id) {
      return tx.building.findUnique({ where: { id } });
    },
    async listUnits(buildingId) {
      return tx.unit.findMany({
        where: { buildingId },
        orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
      });
    },
    async listRevenues(buildingId, year, month) {
      return tx.revenue.findMany({
        where: {
          buildingId,
          fiscalYear: year,
          ...(month === undefined ? {} : { fiscalMonth: month }),
        },
        orderBy: [{ date: "asc" }, { voucherNo: "asc" }],
      });
    },
    async getRevenue(buildingId, id) {
      return tx.revenue.findFirst({ where: { id, buildingId } });
    },
    async listExpenses(buildingId, year, month) {
      return tx.expense.findMany({
        where: {
          buildingId,
          fiscalYear: year,
          ...(month === undefined ? {} : { fiscalMonth: month }),
        },
        orderBy: [{ fiscalMonth: "asc" }, { itemNo: "asc" }],
      });
    },
    async listUtilityBills(buildingId, year, month) {
      return tx.utilityBill.findMany({
        where: {
          buildingId,
          fiscalYear: year,
          ...(month === undefined ? {} : { fiscalMonth: month }),
        },
        orderBy: [{ paymentDate: "asc" }],
      });
    },
    async listContracts(buildingId) {
      return tx.contract.findMany({ where: { buildingId }, orderBy: { startDate: "asc" } });
    },
    async listUsers() {
      return tx.profile.findMany({ orderBy: { name: "asc" } });
    },
    async findUserByEmail(email) {
      return tx.profile.findUnique({ where: { email } });
    },
    async loadSnapshotBundle(buildingId, year) {
      const row = await tx.building.findUnique({
        where: { id: buildingId },
        include: snapshotInclude(year),
      });
      return row ? bundleOf(row) : null;
    },
    async loadAllSnapshotBundles(year) {
      const rows = await tx.building.findMany({
        orderBy: { createdAt: "asc" },
        include: snapshotInclude(year),
      });
      return rows.map(bundleOf);
    },
  };
}

const scopedStore = (context: TenantContext): Store => ({
  async listBuildings() {
    return withTenant(context, (tx) => tenantStoreIn(tx).listBuildings());
  },
  async getBuilding(id) {
    return withTenant(context, (tx) => tenantStoreIn(tx).getBuilding(id));
  },
  async listUnits(buildingId) {
    return withTenant(context, (tx) => tenantStoreIn(tx).listUnits(buildingId));
  },
  async listRevenues(buildingId, year, month) {
    return withTenant(context, (tx) => tenantStoreIn(tx).listRevenues(buildingId, year, month));
  },
  async getRevenue(buildingId, id) {
    return withTenant(context, (tx) => tenantStoreIn(tx).getRevenue(buildingId, id));
  },
  async listExpenses(buildingId, year, month) {
    return withTenant(context, (tx) => tenantStoreIn(tx).listExpenses(buildingId, year, month));
  },
  async listUtilityBills(buildingId, year, month) {
    return withTenant(context, (tx) => tenantStoreIn(tx).listUtilityBills(buildingId, year, month));
  },
  async listContracts(buildingId) {
    return withTenant(context, (tx) => tenantStoreIn(tx).listContracts(buildingId));
  },
  async listUsers() {
    return withTenant(context, (tx) => tenantStoreIn(tx).listUsers());
  },
  async findUserByEmail(email) {
    return withTenant(context, (tx) => tenantStoreIn(tx).findUserByEmail(email));
  },
  async loadSnapshotBundle(buildingId, year) {
    return withTenant(context, (tx) => tenantStoreIn(tx).loadSnapshotBundle(buildingId, year));
  },
  async loadAllSnapshotBundles(year) {
    return withTenant(context, (tx) => tenantStoreIn(tx).loadAllSnapshotBundles(year));
  },
});

export function store(): Store {
  return databaseConfigured() ? prismaStore : demoStore;
}

/**
 * Store bound to the caller's identity. Every query runs inside a transaction
 * that carries the session claims, so the Row Level Security policies decide
 * which rows the caller may reach.
 */
export function tenantStore(context: TenantContext): Store {
  return databaseConfigured() ? scopedStore(context) : demoStore;
}

export function isDemoMode(): boolean {
  return !databaseConfigured();
}
