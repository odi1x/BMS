"use client";

import { useActionState } from "react";
import {
  createUtilityBillAction,
  updateUtilityBillAction,
  IDLE_STATE,
} from "@/app/actions/records";

export type BillFormValues = {
  id?: string;
  type: string;
  accountNo: string;
  meterNo: string;
  amount: string;
  paymentDate: string;
};

const BILL_TYPES = [
  "الاتصالات والإنترنت",
  "عداد كهرباء للبرج (أ)",
  "عداد كهرباء للبرج (ب)",
  "شركة المياه الوطنية",
];

export function BillForm({
  buildingId,
  fiscalYear,
  fiscalMonth,
  defaultDate,
  bill,
  labels,
}: {
  buildingId: string;
  fiscalYear: number;
  fiscalMonth: number;
  defaultDate: string;
  bill?: BillFormValues;
  labels: {
    type: string;
    accountNo: string;
    meterNo: string;
    amount: string;
    date: string;
    save: string;
    saving: string;
    saved: string;
    required: string;
  };
}) {
  const editing = Boolean(bill?.id);
  const action = editing ? updateUtilityBillAction : createUtilityBillAction;
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" noValidate>
      <input type="hidden" name="buildingId" value={buildingId} />
      <input type="hidden" name="fiscalYear" value={fiscalYear} />
      <input type="hidden" name="fiscalMonth" value={fiscalMonth} />
      {bill?.id ? <input type="hidden" name="id" value={bill.id} /> : null}

      <div>
        <label className="field-label" htmlFor="billType">
          {labels.type}
        </label>
        <select
          id="billType"
          name="type"
          className="select"
          defaultValue={bill?.type ?? BILL_TYPES[0]}
          required
        >
          {BILL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.type ? <p className="field-hint text-negative">{errors.type}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="billAccount">
          {labels.accountNo}
        </label>
        <input
          id="billAccount"
          name="accountNo"
          defaultValue={bill?.accountNo ?? ""}
          className="input num"
          dir="ltr"
          placeholder="1821913005"
          required
        />
        {errors.accountNo ? <p className="field-hint text-negative">{errors.accountNo}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="billMeter">
          {labels.meterNo}
        </label>
        <input
          id="billMeter"
          name="meterNo"
          defaultValue={bill?.meterNo ?? ""}
          className="input num"
          dir="ltr"
          placeholder="HLY2020627038687"
        />
        {errors.meterNo ? <p className="field-hint text-negative">{errors.meterNo}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="billAmount">
          {labels.amount}
        </label>
        <input
          id="billAmount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={bill?.amount ?? ""}
          className="input num"
          dir="ltr"
          placeholder="2,072.81"
          required
        />
        {errors.amount ? <p className="field-hint text-negative">{errors.amount}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="billDate">
          {labels.date}
        </label>
        <input
          id="billDate"
          name="paymentDate"
          type="date"
          defaultValue={bill?.paymentDate ?? defaultDate}
          className="input num"
          dir="ltr"
          required
        />
        {errors.paymentDate ? (
          <p className="field-hint text-negative">{errors.paymentDate}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
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
