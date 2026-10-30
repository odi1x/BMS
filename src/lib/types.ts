export type Role = "ADMIN" | "USER";

export type PaymentChannel = "CASH" | "BANK_TRANSFER" | "OTHER";

export type BuildingRecord = {
  id: string;
  name: string;
  registrationNo: string | null;
  unifiedId: string | null;
  address: string | null;
  iban: string | null;
  chairmanName: string | null;
  stampUrl: string | null;
  stampFileId: string | null;
};

export type UnitRecord = {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor: string | null;
  titleDeedNo: string | null;
  hasParking: boolean;
  parkingCardNo: string | null;
  electricityMeterNo: string | null;
  waterMeterNo: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  tenantName: string | null;
  tenantPhone: string | null;
  rentalDeed: string | null;
  unitArea: number | null;
  annualFee: number;
  additionalFees: number;
  photoUrl: string | null;
};

export type RevenueRecord = {
  id: string;
  buildingId: string;
  unitId: string | null;
  voucherNo: string;
  date: Date;
  fiscalYear: number;
  fiscalMonth: number;
  amount: number;
  paymentChannel: PaymentChannel;
  notes: string | null;
  createdAt: Date;
};

export type ExpenseRecord = {
  id: string;
  buildingId: string;
  itemNo: number;
  category: string;
  amount: number;
  fiscalYear: number;
  fiscalMonth: number;
  notes: string | null;
  createdAt: Date;
};

export type UtilityBillRecord = {
  id: string;
  buildingId: string;
  type: string;
  accountNo: string;
  meterNo: string | null;
  amount: number;
  paymentDate: Date;
  fiscalYear: number;
  fiscalMonth: number;
};

export type ContractRecord = {
  id: string;
  buildingId: string;
  title: string;
  totalAmount: number;
  itemCount: number | null;
  startDate: Date;
  endDate: Date;
  nextDueDate: Date | null;
  balanceDue: number | null;
  vendor: string | null;
  paidAmount: number;
  installment: number | null;
  paymentNote: string | null;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  role: Role;
  buildingId: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  buildingId: string | null;
};

export type UnitSettlement = {
  unitId: string;
  unitNumber: string;
  floor: string | null;
  ownerName: string | null;
  annualFee: number;
  additionalFees: number;
  required: number;
  collected: number;
  outstanding: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
  lastPaymentDate: Date | null;
};

export type FiscalPeriod = {
  year: number;
  month: number;
};

export type MonthlyPoint = {
  month: number;
  label: string;
  revenue: number;
  expenses: number;
  net: number;
};
