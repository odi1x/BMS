"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBuildingAccess, requireUser } from "@/lib/auth";
import { type ActionState } from "@/lib/action-state";
import { databaseConfigured } from "@/lib/db";
import { tenantDb } from "@/lib/db/tenant";
import { invalidateSnapshots } from "@/lib/queries";
import {
  buildingProfileSchema,
  buildingSchema,
  contractSchema,
  contractUpdateSchema,
  expenseSchema,
  expenseUpdateSchema,
  fieldErrors,
  revenueSchema,
  revenueUpdateSchema,
  unitSchema,
  unitUpdateSchema,
  utilityBillSchema,
  utilityBillUpdateSchema,
} from "@/lib/validation";

const DEMO_MESSAGE = "قاعدة البيانات غير مهيأة · السجل التجريبي للقراءة فقط.";

/** معرّف برج ASCII: يمر في ترويسات HTTP والمسارات دون ترميز. */
function buildingIdFromName(name: string): string {
  const slug = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9-]/g, "")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return slug ? `bld-${slug}-${unique}` : `bld-${unique}`;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function optionalText(formData: FormData, key: string): string {
  return text(formData, key).trim();
}

function revalidateBuilding(buildingId: string, ...paths: string[]): void {
  for (const path of paths) revalidatePath(`/buildings/${buildingId}${path}`);
  invalidateSnapshots(buildingId);
}

/* ------------------------------------------------------------------ *
 * الإيرادات — سندات القبض
 * ------------------------------------------------------------------ */

export async function createRevenueAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    buildingId: text(formData, "buildingId"),
    fiscalYear: formData.get("fiscalYear") ?? "",
    fiscalMonth: formData.get("fiscalMonth") ?? "",
    voucherNo: text(formData, "voucherNo"),
    date: text(formData, "date"),
    unitId: text(formData, "unitId"),
    amount: formData.get("amount") ?? "",
    paymentChannel: text(formData, "paymentChannel"),
    notes: text(formData, "notes"),
  };

  const parsed = revenueSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const unit = await db.unit.findFirst({
    where: { id: parsed.data.unitId, buildingId: parsed.data.buildingId },
    select: { id: true },
  });
  if (!unit) return { status: "error", message: "UNIT_NOT_FOUND" };

  const duplicate = await db.revenue.findFirst({
    where: {
      buildingId: parsed.data.buildingId,
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
      voucherNo: parsed.data.voucherNo,
    },
    select: { id: true },
  });
  if (duplicate) return { status: "error", message: "VOUCHER_DUPLICATE" };

  await db.revenue.create({
    data: {
      buildingId: parsed.data.buildingId,
      unitId: parsed.data.unitId,
      voucherNo: parsed.data.voucherNo,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
      amount: parsed.data.amount,
      paymentChannel: parsed.data.paymentChannel,
      notes: parsed.data.notes || null,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/revenues", "", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

export async function updateRevenueAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    id: text(formData, "id"),
    buildingId: text(formData, "buildingId"),
    fiscalYear: formData.get("fiscalYear") ?? "",
    fiscalMonth: formData.get("fiscalMonth") ?? "",
    voucherNo: text(formData, "voucherNo"),
    date: text(formData, "date"),
    unitId: text(formData, "unitId"),
    amount: formData.get("amount") ?? "",
    paymentChannel: text(formData, "paymentChannel"),
    notes: text(formData, "notes"),
  };

  const parsed = revenueUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const existing = await db.revenue.findFirst({
    where: { id: parsed.data.id, buildingId: parsed.data.buildingId },
    select: { id: true },
  });
  if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };

  await db.revenue.update({
    where: { id: parsed.data.id },
    data: {
      unitId: parsed.data.unitId,
      voucherNo: parsed.data.voucherNo,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
      amount: parsed.data.amount,
      paymentChannel: parsed.data.paymentChannel,
      notes: parsed.data.notes || null,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/revenues", "", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

/* ------------------------------------------------------------------ *
 * الشقق
 * ------------------------------------------------------------------ */

export async function createUnitAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    buildingId: text(formData, "buildingId"),
    unitNumber: text(formData, "unitNumber"),
    floor: text(formData, "floor"),
    titleDeedNo: text(formData, "titleDeedNo"),
    hasParking: formData.get("hasParking") === "on",
    parkingCardNo: text(formData, "parkingCardNo"),
    electricityMeterNo: text(formData, "electricityMeterNo"),
    waterMeterNo: text(formData, "waterMeterNo"),
    ownerName: text(formData, "ownerName"),
    ownerPhone: text(formData, "ownerPhone"),
    tenantName: text(formData, "tenantName"),
    tenantPhone: text(formData, "tenantPhone"),
    rentalDeed: text(formData, "rentalDeed"),
    unitArea: formData.get("unitArea") || undefined,
    annualFee: formData.get("annualFee") ?? 0,
    additionalFees: formData.get("additionalFees") ?? 0,
  };

  const parsed = unitSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  await db.unit.create({
    data: {
      buildingId: parsed.data.buildingId,
      unitNumber: parsed.data.unitNumber,
      floor: parsed.data.floor || null,
      titleDeedNo: parsed.data.titleDeedNo || null,
      hasParking: parsed.data.hasParking,
      parkingCardNo: parsed.data.parkingCardNo || null,
      electricityMeterNo: parsed.data.electricityMeterNo || null,
      waterMeterNo: parsed.data.waterMeterNo || null,
      ownerName: parsed.data.ownerName || null,
      ownerPhone: parsed.data.ownerPhone || null,
      tenantName: parsed.data.tenantName || null,
      tenantPhone: parsed.data.tenantPhone || null,
      rentalDeed: parsed.data.rentalDeed || null,
      unitArea: parsed.data.unitArea ?? null,
      annualFee: parsed.data.annualFee,
      additionalFees: parsed.data.additionalFees,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/units", "");

  return { status: "ok", message: "SAVED" };
}

export async function updateUnitAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    id: text(formData, "id"),
    buildingId: text(formData, "buildingId"),
    unitNumber: text(formData, "unitNumber"),
    floor: text(formData, "floor"),
    titleDeedNo: text(formData, "titleDeedNo"),
    hasParking: formData.get("hasParking") === "on",
    parkingCardNo: text(formData, "parkingCardNo"),
    electricityMeterNo: text(formData, "electricityMeterNo"),
    waterMeterNo: text(formData, "waterMeterNo"),
    ownerName: text(formData, "ownerName"),
    ownerPhone: text(formData, "ownerPhone"),
    tenantName: text(formData, "tenantName"),
    tenantPhone: text(formData, "tenantPhone"),
    rentalDeed: text(formData, "rentalDeed"),
    unitArea: formData.get("unitArea") || undefined,
    annualFee: formData.get("annualFee") ?? 0,
    additionalFees: formData.get("additionalFees") ?? 0,
  };

  const parsed = unitUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const existing = await db.unit.findFirst({
    where: { id: parsed.data.id, buildingId: parsed.data.buildingId },
    select: { id: true },
  });
  if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };

  await db.unit.update({
    where: { id: parsed.data.id },
    data: {
      unitNumber: parsed.data.unitNumber,
      floor: parsed.data.floor || null,
      titleDeedNo: parsed.data.titleDeedNo || null,
      hasParking: parsed.data.hasParking,
      parkingCardNo: parsed.data.parkingCardNo || null,
      electricityMeterNo: parsed.data.electricityMeterNo || null,
      waterMeterNo: parsed.data.waterMeterNo || null,
      ownerName: parsed.data.ownerName || null,
      ownerPhone: parsed.data.ownerPhone || null,
      tenantName: parsed.data.tenantName || null,
      tenantPhone: parsed.data.tenantPhone || null,
      rentalDeed: parsed.data.rentalDeed || null,
      unitArea: parsed.data.unitArea ?? null,
      annualFee: parsed.data.annualFee,
      additionalFees: parsed.data.additionalFees,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/units", "");

  return { status: "ok", message: "SAVED" };
}

/* ------------------------------------------------------------------ *
 * المصروفات العامة
 * ------------------------------------------------------------------ */

export async function createExpenseAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    buildingId: text(formData, "buildingId"),
    itemNo: formData.get("itemNo") ?? 1,
    category: text(formData, "category"),
    amount: formData.get("amount") ?? "",
    fiscalYear: formData.get("fiscalYear") ?? "",
    fiscalMonth: formData.get("fiscalMonth") ?? "",
    notes: text(formData, "notes"),
  };

  const parsed = expenseSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  await db.expense.create({
    data: {
      buildingId: parsed.data.buildingId,
      itemNo: parsed.data.itemNo,
      category: parsed.data.category,
      amount: parsed.data.amount,
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
      notes: parsed.data.notes || null,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/expenses", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

export async function updateExpenseAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    id: text(formData, "id"),
    buildingId: text(formData, "buildingId"),
    itemNo: formData.get("itemNo") ?? 1,
    category: text(formData, "category"),
    amount: formData.get("amount") ?? "",
    fiscalYear: formData.get("fiscalYear") ?? "",
    fiscalMonth: formData.get("fiscalMonth") ?? "",
    notes: text(formData, "notes"),
  };

  const parsed = expenseUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const existing = await db.expense.findFirst({
    where: { id: parsed.data.id, buildingId: parsed.data.buildingId },
    select: { id: true },
  });
  if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };

  await db.expense.update({
    where: { id: parsed.data.id },
    data: {
      itemNo: parsed.data.itemNo,
      category: parsed.data.category,
      amount: parsed.data.amount,
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
      notes: parsed.data.notes || null,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/expenses", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

/* ------------------------------------------------------------------ *
 * فواتير الخدمات المباشرة
 * ------------------------------------------------------------------ */

export async function createUtilityBillAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    buildingId: text(formData, "buildingId"),
    type: text(formData, "type"),
    accountNo: text(formData, "accountNo"),
    meterNo: text(formData, "meterNo"),
    amount: formData.get("amount") ?? "",
    paymentDate: text(formData, "paymentDate"),
    fiscalYear: formData.get("fiscalYear") ?? "",
    fiscalMonth: formData.get("fiscalMonth") ?? "",
  };

  const parsed = utilityBillSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  await db.utilityBill.create({
    data: {
      buildingId: parsed.data.buildingId,
      type: parsed.data.type,
      accountNo: parsed.data.accountNo,
      meterNo: parsed.data.meterNo || null,
      amount: parsed.data.amount,
      paymentDate: new Date(`${parsed.data.paymentDate}T00:00:00.000Z`),
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/expenses", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

export async function updateUtilityBillAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    id: text(formData, "id"),
    buildingId: text(formData, "buildingId"),
    type: text(formData, "type"),
    accountNo: text(formData, "accountNo"),
    meterNo: text(formData, "meterNo"),
    amount: formData.get("amount") ?? "",
    paymentDate: text(formData, "paymentDate"),
    fiscalYear: formData.get("fiscalYear") ?? "",
    fiscalMonth: formData.get("fiscalMonth") ?? "",
  };

  const parsed = utilityBillUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const existing = await db.utilityBill.findFirst({
    where: { id: parsed.data.id, buildingId: parsed.data.buildingId },
    select: { id: true },
  });
  if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };

  await db.utilityBill.update({
    where: { id: parsed.data.id },
    data: {
      type: parsed.data.type,
      accountNo: parsed.data.accountNo,
      meterNo: parsed.data.meterNo || null,
      amount: parsed.data.amount,
      paymentDate: new Date(`${parsed.data.paymentDate}T00:00:00.000Z`),
      fiscalYear: parsed.data.fiscalYear,
      fiscalMonth: parsed.data.fiscalMonth,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/expenses", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

/* ------------------------------------------------------------------ *
 * العقود
 * ------------------------------------------------------------------ */

export async function createContractAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    buildingId: text(formData, "buildingId"),
    title: text(formData, "title"),
    vendor: text(formData, "vendor"),
    totalAmount: formData.get("totalAmount") ?? "",
    itemCount: formData.get("itemCount") || undefined,
    startDate: text(formData, "startDate"),
    endDate: text(formData, "endDate"),
    nextDueDate: text(formData, "nextDueDate"),
    paidAmount: formData.get("paidAmount") ?? 0,
    installment: formData.get("installment") || undefined,
    balanceDue: formData.get("balanceDue") || undefined,
    paymentNote: text(formData, "paymentNote"),
  };

  const parsed = contractSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  await db.contract.create({
    data: {
      buildingId: parsed.data.buildingId,
      title: parsed.data.title,
      vendor: parsed.data.vendor || null,
      totalAmount: parsed.data.totalAmount,
      itemCount: parsed.data.itemCount ?? null,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      nextDueDate: parsed.data.nextDueDate
        ? new Date(`${parsed.data.nextDueDate}T00:00:00.000Z`)
        : null,
      paidAmount: parsed.data.paidAmount,
      installment: parsed.data.installment ?? null,
      balanceDue: parsed.data.balanceDue ?? null,
      paymentNote: parsed.data.paymentNote || null,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/expenses", "");

  return { status: "ok", message: "SAVED" };
}

export async function updateContractAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    id: text(formData, "id"),
    buildingId: text(formData, "buildingId"),
    title: text(formData, "title"),
    vendor: text(formData, "vendor"),
    totalAmount: formData.get("totalAmount") ?? "",
    itemCount: formData.get("itemCount") || undefined,
    startDate: text(formData, "startDate"),
    endDate: text(formData, "endDate"),
    nextDueDate: text(formData, "nextDueDate"),
    paidAmount: formData.get("paidAmount") ?? 0,
    installment: formData.get("installment") || undefined,
    balanceDue: formData.get("balanceDue") || undefined,
    paymentNote: text(formData, "paymentNote"),
  };

  const parsed = contractUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const existing = await db.contract.findFirst({
    where: { id: parsed.data.id, buildingId: parsed.data.buildingId },
    select: { id: true },
  });
  if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };

  await db.contract.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      vendor: parsed.data.vendor || null,
      totalAmount: parsed.data.totalAmount,
      itemCount: parsed.data.itemCount ?? null,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      nextDueDate: parsed.data.nextDueDate
        ? new Date(`${parsed.data.nextDueDate}T00:00:00.000Z`)
        : null,
      paidAmount: parsed.data.paidAmount,
      installment: parsed.data.installment ?? null,
      balanceDue: parsed.data.balanceDue ?? null,
      paymentNote: parsed.data.paymentNote || null,
    },
  });

  revalidateBuilding(parsed.data.buildingId, "/expenses", "");

  return { status: "ok", message: "SAVED" };
}

/* ------------------------------------------------------------------ *
 * الحذف — سجل واحد لكل نوع
 * ------------------------------------------------------------------ */

export type DeletableKind = "unit" | "revenue" | "expense" | "bill" | "contract";

export async function deleteRecordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const kind = text(formData, "kind") as DeletableKind;
  const id = text(formData, "id");
  const buildingId = text(formData, "buildingId");

  if (!["unit", "revenue", "expense", "bill", "contract"].includes(kind)) {
    return { status: "error", message: "FORM_INVALID" };
  }

  const session = await requireBuildingAccess(buildingId);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  switch (kind) {
    case "unit": {
      const existing = await db.unit.findFirst({
        where: { id, buildingId },
        select: { id: true },
      });
      if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };
      await db.revenue.deleteMany({ where: { unitId: id, buildingId } });
      await db.unit.delete({ where: { id } });
      break;
    }
    case "revenue": {
      const existing = await db.revenue.findFirst({
        where: { id, buildingId },
        select: { id: true },
      });
      if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };
      await db.revenue.delete({ where: { id } });
      break;
    }
    case "expense": {
      const existing = await db.expense.findFirst({
        where: { id, buildingId },
        select: { id: true },
      });
      if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };
      await db.expense.delete({ where: { id } });
      break;
    }
    case "bill": {
      const existing = await db.utilityBill.findFirst({
        where: { id, buildingId },
        select: { id: true },
      });
      if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };
      await db.utilityBill.delete({ where: { id } });
      break;
    }
    case "contract": {
      const existing = await db.contract.findFirst({
        where: { id, buildingId },
        select: { id: true },
      });
      if (!existing) return { status: "error", message: "RECORD_NOT_FOUND" };
      await db.contract.delete({ where: { id } });
      break;
    }
  }

  revalidateBuilding(buildingId, "/units", "/revenues", "/expenses", "", "/financial-summary");

  return { status: "ok", message: "DELETED" };
}

/* ------------------------------------------------------------------ *
 * بيانات الجمعية
 * ------------------------------------------------------------------ */

export async function updateBuildingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    id: text(formData, "id"),
    name: text(formData, "name"),
    registrationNo: text(formData, "registrationNo"),
    unifiedId: text(formData, "unifiedId"),
    chairmanName: text(formData, "chairmanName"),
    address: text(formData, "address"),
    iban: text(formData, "iban"),
    stampUrl: text(formData, "stampUrl"),
    stampFileId: text(formData, "stampFileId"),
  };

  const parsed = buildingSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  const session = await requireBuildingAccess(parsed.data.id);
  const db = tenantDb(session);

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  await db.building.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      registrationNo: parsed.data.registrationNo || null,
      unifiedId: parsed.data.unifiedId || null,
      chairmanName: parsed.data.chairmanName || null,
      address: parsed.data.address || null,
      iban: parsed.data.iban || null,
      stampUrl: parsed.data.stampUrl || null,
      stampFileId: parsed.data.stampFileId || null,
    },
  });

  revalidateBuilding(parsed.data.id, "/settings", "", "/revenues", "/financial-summary");

  return { status: "ok", message: "SAVED" };
}

/** إنشاء برج/جمعية جديدة — مدير النظام فقط. */
export async function createBuildingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();
  const db = tenantDb(session);
  if (session.role !== "ADMIN") return { status: "error", message: "FORBIDDEN" };

  const payload = {
    name: text(formData, "name"),
    registrationNo: text(formData, "registrationNo"),
    unifiedId: text(formData, "unifiedId"),
    chairmanName: text(formData, "chairmanName"),
    address: text(formData, "address"),
    iban: text(formData, "iban"),
  };

  const parsed = buildingProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "FORM_INVALID", errors: fieldErrors(parsed.error) };
  }

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const id = buildingIdFromName(parsed.data.name);

  await db.building.create({
    data: {
      id,
      name: parsed.data.name,
      registrationNo: parsed.data.registrationNo || null,
      unifiedId: parsed.data.unifiedId || null,
      chairmanName: parsed.data.chairmanName || null,
      address: parsed.data.address || null,
      iban: parsed.data.iban || null,
    },
  });

  revalidatePath("/");
  invalidateSnapshots();
  redirect(`/buildings/${id}`);
}

/** إنشاء مشرف برج مرتبط ببرج محدد — مدير النظام فقط. */
export async function assignSupervisorAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();
  const db = tenantDb(session);
  if (session.role !== "ADMIN") return { status: "error", message: "FORBIDDEN" };

  const email = optionalText(formData, "email").toLowerCase();
  const name = optionalText(formData, "name");
  const buildingId = optionalText(formData, "buildingId");

  if (!email || !name || !buildingId) {
    return { status: "error", message: "FORM_INVALID" };
  }

  if (!databaseConfigured()) {
    return { status: "error", message: DEMO_MESSAGE };
  }

  const building = await db.building.findUnique({
    where: { id: buildingId },
    select: { id: true },
  });
  if (!building) return { status: "error", message: "RECORD_NOT_FOUND" };

  const existing = await db.profile.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return { status: "error", message: "EMAIL_TAKEN" };

  const bcrypt = await import("bcryptjs");
  const password = optionalText(formData, "password") || "123456";

  await db.profile.create({
    data: {
      email,
      name,
      role: "USER",
      buildingId,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  revalidatePath("/users");
  return { status: "ok", message: "SAVED" };
}
