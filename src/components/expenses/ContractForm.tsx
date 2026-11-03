"use client";

import { useActionState } from "react";
import { createContractAction, updateContractAction } from "@/app/actions/records";
import { IDLE_STATE } from "@/lib/action-state";

export type ContractFormValues = {
  id?: string;
  title: string;
  vendor: string;
  totalAmount: string;
  itemCount: string;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  paidAmount: string;
  installment: string;
  balanceDue: string;
  paymentNote: string;
};

export function ContractForm({
  buildingId,
  contract,
  labels,
}: {
  buildingId: string;
  contract?: ContractFormValues;
  labels: {
    title: string;
    vendor: string;
    totalAmount: string;
    itemCount: string;
    startDate: string;
    endDate: string;
    nextDueDate: string;
    paidAmount: string;
    installment: string;
    balanceDue: string;
    paymentNote: string;
    save: string;
    saving: string;
    saved: string;
    required: string;
  };
}) {
  const editing = Boolean(contract?.id);
  const action = editing ? updateContractAction : createContractAction;
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.errors ?? {};

  const field = (
    name: keyof ContractFormValues,
    label: string,
    options: { type?: "text" | "number" | "date"; required?: boolean; placeholder?: string } = {},
  ) => {
    const value = contract?.[name];
    return (
      <div>
        <label className="field-label" htmlFor={`contract-${name}`}>
          {label}
          {options.required ? <span className="text-negative"> *</span> : null}
        </label>
        <input
          id={`contract-${name}`}
          name={name}
          type={options.type ?? "text"}
          className={`input ${options.type === "number" || options.type === "date" ? "num" : ""}`}
          defaultValue={value === undefined || value === null ? "" : String(value)}
          placeholder={options.placeholder}
          required={options.required}
          step={options.type === "number" ? "0.01" : undefined}
          min={options.type === "number" ? "0" : undefined}
          dir={options.type === "date" ? "ltr" : undefined}
        />
        {errors[name] ? <p className="field-hint text-negative">{errors[name]}</p> : null}
      </div>
    );
  };

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" noValidate>
      <input type="hidden" name="buildingId" value={buildingId} />
      {contract?.id ? <input type="hidden" name="id" value={contract.id} /> : null}

      <div className="sm:col-span-2">
        {field("title", labels.title, {
          required: true,
          placeholder: "عقد صيانة المصاعد",
        })}
      </div>
      {field("vendor", labels.vendor, { placeholder: "شركة المصاعد السعودية" })}

      {field("totalAmount", labels.totalAmount, {
        type: "number",
        required: true,
        placeholder: "14000",
      })}
      {field("itemCount", labels.itemCount, { type: "number", placeholder: "7" })}
      {field("paidAmount", labels.paidAmount, { type: "number", placeholder: "6000" })}

      {field("startDate", labels.startDate, { type: "date", required: true })}
      {field("endDate", labels.endDate, { type: "date", required: true })}
      {field("nextDueDate", labels.nextDueDate, { type: "date" })}

      {field("installment", labels.installment, { type: "number", placeholder: "2000" })}
      {field("balanceDue", labels.balanceDue, { type: "number", placeholder: "8000" })}

      <div className="sm:col-span-2 lg:col-span-3">
        {field("paymentNote", labels.paymentNote, { placeholder: "قسط مستحق في 1 يوليو 2026" })}
      </div>

      <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
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
