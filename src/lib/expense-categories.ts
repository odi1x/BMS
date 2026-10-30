/**
 * بنود المصروفات العامة الاثنا عشر — مطابقة لجدول المصروفات في PRD §4.B.
 * الترتيب هنا هو ترتيب "م" في الجدول الرسمي.
 */

export type ExpenseCategory = {
  itemNo: number;
  label: string;
  labelEn: string;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { itemNo: 1, label: "فواتير الاتصالات والنت", labelEn: "Telecom & internet" },
  { itemNo: 2, label: "فواتير الكهرباء", labelEn: "Electricity bills" },
  { itemNo: 3, label: "فاتورة شركة المياه", labelEn: "Water company bill" },
  { itemNo: 4, label: "عقد النظافة والإشراف على البرج", labelEn: "Cleaning & supervision" },
  { itemNo: 5, label: "عقد صيانة المصاعد", labelEn: "Elevator maintenance" },
  { itemNo: 6, label: "إصلاح وقطع الغيار للمصاعد", labelEn: "Elevator repairs & parts" },
  { itemNo: 7, label: "أدوات النظافة", labelEn: "Cleaning supplies" },
  { itemNo: 8, label: "إصلاحات السباكة وأدواتها", labelEn: "Plumbing repairs" },
  { itemNo: 9, label: "إصلاحات الكهرباء وأدواتها", labelEn: "Electrical repairs" },
  { itemNo: 10, label: "الترميم", labelEn: "Restoration" },
  { itemNo: 11, label: "الرواتب", labelEn: "Staff payroll" },
  { itemNo: 12, label: "أخرى (النثريات)", labelEn: "Miscellaneous" },
];

const BY_LABEL = new Map(EXPENSE_CATEGORIES.map((category) => [category.label, category.itemNo]));

/** رقم البند القياسي المقابل لاسم البند، أو null إن كان بنداً مخصصاً. */
export function standardItemNo(category: string): number | null {
  return BY_LABEL.get(category.trim()) ?? null;
}

/** رقم البند القياسي لفاتورة خدمات مباشرة (PRD §4.A). */
export function utilityItemNo(type: string): number | null {
  if (type.includes("كهرباء") || type.toLowerCase().includes("power")) return 2;
  if (type.includes("مياه") || type.toLowerCase().includes("water")) return 3;
  if (type.includes("اتصالات") || type.toLowerCase().includes("telecom")) return 1;
  return null;
}
