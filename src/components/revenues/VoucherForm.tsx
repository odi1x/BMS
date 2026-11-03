"use client";

import { useActionState } from "react";
import { createRevenueAction, updateRevenueAction } from "@/app/actions/records";
import { IDLE_STATE } from "@/lib/action-state";

export type VoucherUnit = { id: string; unitNumber: string; ownerName: string | null };

export type VoucherFormValues = {
  id?: string;
  voucherNo: string;
  date: string;
  unitId: string;
  amount: string;
  paymentChannel: "CASH" | "BANK_TRANSFER" | "OTHER";
  notes: string;
};

export function VoucherForm({
  buildingId,
  units,
  voucherNo,
  fiscalYear,
  fiscalMonth,
  defaultDate,
  voucher,
  labels,
}: {
  buildingId: string;
  units: VoucherUnit[];
  voucherNo: string;
  fiscalYear: number;
  fiscalMonth: number;
  defaultDate: string;
  voucher?: VoucherFormValues;
  labels: {
    fiscalYear: string;
    month: string;
    voucher: string;
    date: string;
    unit: string;
    amount: string;
    channel: string;
    cash: string;
    bank: string;
    other: string;
    notes: string;
    save: string;
    saving: string;
    saved: string;
    required: string;
    duplicate: string;
  };
}) {
  const editing = Boolean(voucher?.id);
  const action = editing ? updateRevenueAction : createRevenueAction;
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" noValidate>
      <input type="hidden" name="buildingId" value={buildingId} />
      <input type="hidden" name="fiscalYear" value={fiscalYear} />
      <input type="hidden" name="fiscalMonth" value={fiscalMonth} />
      {voucher?.id ? <input type="hidden" name="id" value={voucher.id} /> : null}

      <div>
        <label className="field-label" htmlFor="voucherNo">
          {labels.voucher}
        </label>
        <input
          id="voucherNo"
          name="voucherNo"
          defaultValue={voucher?.voucherNo ?? voucherNo}
          className="input num"
          inputMode="numeric"
          dir="ltr"
          required
        />
        {errors.voucherNo ? <p className="field-hint text-negative">{errors.voucherNo}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="voucherDate">
          {labels.date}
        </label>
        <input
          id="voucherDate"
          name="date"
          type="date"
          defaultValue={voucher?.date ?? defaultDate}
          className="input num"
          dir="ltr"
          required
        />
        {errors.date ? <p className="field-hint text-negative">{errors.date}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="voucherUnit">
          {labels.unit}
        </label>
        <select
          id="voucherUnit"
          name="unitId"
          className="select"
          defaultValue={voucher?.unitId ?? ""}
          required
        >
          <option value="" disabled>
            ·
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unitNumber} · {unit.ownerName ?? ""}
            </option>
          ))}
        </select>
        {errors.unitId ? <p className="field-hint text-negative">{errors.unitId}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="voucherAmount">
          {labels.amount}
        </label>
        <input
          id="voucherAmount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={voucher?.amount ?? ""}
          className="input num"
          dir="ltr"
          placeholder="1,800.00"
          required
        />
        {errors.amount ? <p className="field-hint text-negative">{errors.amount}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="voucherChannel">
          {labels.channel}
        </label>
        <select
          id="voucherChannel"
          name="paymentChannel"
          className="select"
          defaultValue={voucher?.paymentChannel ?? "BANK_TRANSFER"}
        >
          <option value="CASH">{labels.cash}</option>
          <option value="BANK_TRANSFER">{labels.bank}</option>
          <option value="OTHER">{labels.other}</option>
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <label className="field-label" htmlFor="voucherNotes">
          {labels.notes}
        </label>
        <input
          id="voucherNotes"
          name="notes"
          defaultValue={voucher?.notes ?? ""}
          className="input"
          placeholder="رسوم خدمات البرج - شقة رقم (35)"
          maxLength={240}
        />
        {errors.notes ? <p className="field-hint text-negative">{errors.notes}</p> : null}
      </div>

      <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.status === "error" ? (
          <p className="text-[13px] text-negative" role="alert">
            {state.message === "FORM_INVALID"
              ? labels.required
              : state.message === "VOUCHER_DUPLICATE"
                ? labels.duplicate
                : state.message}
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
