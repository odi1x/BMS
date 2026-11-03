"use client";

import { useActionState } from "react";
import { createExpenseAction, updateExpenseAction } from "@/app/actions/records";
import { IDLE_STATE } from "@/lib/action-state";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

export type ExpenseFormValues = {
  id?: string;
  itemNo: number;
  category: string;
  amount: string;
  notes: string;
};

export function ExpenseForm({
  buildingId,
  fiscalYear,
  fiscalMonth,
  expense,
  labels,
}: {
  buildingId: string;
  fiscalYear: number;
  fiscalMonth: number;
  expense?: ExpenseFormValues;
  labels: {
    item: string;
    category: string;
    amount: string;
    notes: string;
    save: string;
    saving: string;
    saved: string;
    required: string;
  };
}) {
  const editing = Boolean(expense?.id);
  const action = editing ? updateExpenseAction : createExpenseAction;
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" noValidate>
      <input type="hidden" name="buildingId" value={buildingId} />
      <input type="hidden" name="fiscalYear" value={fiscalYear} />
      <input type="hidden" name="fiscalMonth" value={fiscalMonth} />
      {expense?.id ? <input type="hidden" name="id" value={expense.id} /> : null}

      <div>
        <label className="field-label" htmlFor="expenseItem">
          {labels.item}
        </label>
        <input
          id="expenseItem"
          name="itemNo"
          type="number"
          min="1"
          max="99"
          defaultValue={expense?.itemNo ?? 13}
          className="input num"
          dir="ltr"
          required
        />
        {errors.itemNo ? <p className="field-hint text-negative">{errors.itemNo}</p> : null}
      </div>

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="expenseCategory">
          {labels.category}
        </label>
        <input
          id="expenseCategory"
          name="category"
          className="input"
          list="expense-categories"
          defaultValue={expense?.category ?? ""}
          placeholder="اختر بنداً من جدول المصروفات"
          required
        />
        <datalist id="expense-categories">
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category.itemNo} value={category.label}>
              {category.itemNo}
            </option>
          ))}
        </datalist>
        {errors.category ? <p className="field-hint text-negative">{errors.category}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="expenseAmount">
          {labels.amount}
        </label>
        <input
          id="expenseAmount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={expense?.amount ?? ""}
          className="input num"
          dir="ltr"
          placeholder="1,350.00"
          required
        />
        {errors.amount ? <p className="field-hint text-negative">{errors.amount}</p> : null}
      </div>

      <div className="sm:col-span-3">
        <label className="field-label" htmlFor="expenseNotes">
          {labels.notes}
        </label>
        <input
          id="expenseNotes"
          name="notes"
          defaultValue={expense?.notes ?? ""}
          className="input"
          maxLength={240}
        />
        {errors.notes ? <p className="field-hint text-negative">{errors.notes}</p> : null}
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.status === "error" ? (
          <p className="text-[13px] text-negative" role="alert">
            {state.message === "FORM_INVALID" ? labels.required : state.message}
          </p>
        ) : null}
        {state.status === "ok" ? (
          <p className="text-[13px] text-accent-ink" role="status">
            {labels.saved}
          </p>
        ) : null}
      </div>
    </form>
  );
}
