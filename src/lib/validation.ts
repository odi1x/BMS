import { z } from "zod";

const SAUDI_PHONE = /^05\d{8}$/;
const IBAN = /^SA\d{2}[A-Z0-9]{10,30}$/;

export const revenueSchema = z.object({
  buildingId: z.string().min(1, "required"),
  fiscalYear: z.coerce.number().int().min(2020).max(2100),
  fiscalMonth: z.coerce.number().int().min(1).max(12),
  voucherNo: z.string().trim().regex(/^\d{1,6}$/, "invalid"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid"),
  unitId: z.string().min(1, "required"),
  amount: z.coerce.number().positive().max(1_000_000),
  paymentChannel: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
  notes: z.string().trim().max(240).optional().or(z.literal("")),
});

export const unitSchema = z.object({
  buildingId: z.string().min(1, "required"),
  unitNumber: z.string().trim().min(1).max(40),
  floor: z.string().trim().max(40).optional().or(z.literal("")),
  titleDeedNo: z.string().trim().max(40).optional().or(z.literal("")),
  hasParking: z.boolean().default(false),
  parkingCardNo: z.string().trim().max(40).optional().or(z.literal("")),
  electricityMeterNo: z.string().trim().max(40).optional().or(z.literal("")),
  waterMeterNo: z.string().trim().max(40).optional().or(z.literal("")),
  ownerName: z.string().trim().max(120).optional().or(z.literal("")),
  ownerPhone: z.string().trim().regex(SAUDI_PHONE, "invalid").optional().or(z.literal("")),
  tenantName: z.string().trim().max(120).optional().or(z.literal("")),
  tenantPhone: z.string().trim().regex(SAUDI_PHONE, "invalid").optional().or(z.literal("")),
  rentalDeed: z.string().trim().max(60).optional().or(z.literal("")),
  unitArea: z.coerce.number().min(0).max(1000).optional(),
  annualFee: z.coerce.number().min(0).max(1_000_000),
  additionalFees: z.coerce.number().min(0).max(1_000_000).default(0),
});

export const expenseSchema = z.object({
  buildingId: z.string().min(1, "required"),
  itemNo: z.coerce.number().int().min(1).max(99),
  category: z.string().trim().min(2).max(120),
  amount: z.coerce.number().min(0).max(1_000_000),
  fiscalYear: z.coerce.number().int().min(2020).max(2100),
  fiscalMonth: z.coerce.number().int().min(1).max(12),
  notes: z.string().trim().max(240).optional().or(z.literal("")),
});

export const utilityBillSchema = z.object({
  buildingId: z.string().min(1, "required"),
  type: z.string().trim().min(2).max(120),
  accountNo: z.string().trim().min(1).max(60),
  meterNo: z.string().trim().max(60).optional().or(z.literal("")),
  amount: z.coerce.number().min(0).max(1_000_000),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid"),
  fiscalYear: z.coerce.number().int().min(2020).max(2100),
  fiscalMonth: z.coerce.number().int().min(1).max(12),
});

export const contractSchema = z.object({
  buildingId: z.string().min(1, "required"),
  title: z.string().trim().min(2).max(160),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  totalAmount: z.coerce.number().min(0).max(100_000_000),
  itemCount: z.coerce.number().int().min(1).max(999).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid"),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid").optional().or(z.literal("")),
  paidAmount: z.coerce.number().min(0).max(100_000_000).default(0),
  installment: z.coerce.number().min(0).max(100_000_000).optional(),
  balanceDue: z.coerce.number().min(0).max(100_000_000).optional(),
  paymentNote: z.string().trim().max(240).optional().or(z.literal("")),
});

export const buildingProfileSchema = z.object({
  name: z.string().trim().min(3).max(160),
  registrationNo: z.string().trim().max(40).optional().or(z.literal("")),
  unifiedId: z.string().trim().max(40).optional().or(z.literal("")),
  chairmanName: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  iban: z.string().trim().regex(IBAN, "invalid").optional().or(z.literal("")),
  stampUrl: z.string().trim().max(400).optional().or(z.literal("")),
  stampFileId: z.string().trim().max(200).optional().or(z.literal("")),
});

export const buildingSchema = buildingProfileSchema.extend({
  id: z.string().min(1, "required"),
});

export const unitUpdateSchema = unitSchema.extend({
  id: z.string().min(1, "required"),
});

export const revenueUpdateSchema = revenueSchema.extend({
  id: z.string().min(1, "required"),
});

export const expenseUpdateSchema = expenseSchema.extend({
  id: z.string().min(1, "required"),
});

export const utilityBillUpdateSchema = utilityBillSchema.extend({
  id: z.string().min(1, "required"),
});

export const contractUpdateSchema = contractSchema.extend({
  id: z.string().min(1, "required"),
});

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
