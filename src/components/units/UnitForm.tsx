"use client";

import { useActionState } from "react";
import { createUnitAction, updateUnitAction } from "@/app/actions/records";
import { IDLE_STATE } from "@/lib/action-state";

export type UnitFormValues = {
  id?: string;
  unitNumber: string;
  floor: string;
  titleDeedNo: string;
  hasParking: boolean;
  parkingCardNo: string;
  electricityMeterNo: string;
  waterMeterNo: string;
  ownerName: string;
  ownerPhone: string;
  tenantName: string;
  tenantPhone: string;
  rentalDeed: string;
  unitArea: string;
  annualFee: string;
  additionalFees: string;
};

export function UnitForm({
  buildingId,
  unit,
  labels,
}: {
  buildingId: string;
  unit?: UnitFormValues;
  labels: {
    unitNumber: string;
    floor: string;
    titleDeed: string;
    hasParking: string;
    parkingCard: string;
    electricityMeter: string;
    waterMeter: string;
    owner: string;
    ownerPhone: string;
    tenant: string;
    tenantPhone: string;
    rentalDeed: string;
    area: string;
    annualFee: string;
    additionalFees: string;
    save: string;
    saving: string;
    saved: string;
    required: string;
    optional: string;
  };
}) {
  const editing = Boolean(unit?.id);
  const action = editing ? updateUnitAction : createUnitAction;
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.errors ?? {};

  const field = (
    name: keyof UnitFormValues,
    label: string,
    options: {
      type?: "text" | "number" | "tel";
      placeholder?: string;
      required?: boolean;
      step?: string;
      min?: string;
      dir?: "ltr";
      className?: string;
      inputMode?: "text" | "numeric" | "tel" | "decimal";
    } = {},
  ) => {
    const value = unit?.[name];
    return (
      <div className={options.className ?? ""}>
        <label className="field-label" htmlFor={`unit-${name}`}>
          {label}
          {options.required ? <span className="text-negative"> *</span> : null}
        </label>
        <input
          id={`unit-${name}`}
          name={name}
          type={options.type ?? "text"}
          className={`input ${options.type === "number" ? "num" : ""}`}
          defaultValue={value === undefined || value === null ? "" : String(value)}
          placeholder={options.placeholder}
          required={options.required}
          step={options.step}
          min={options.min}
          dir={options.dir}
          inputMode={options.inputMode}
        />
        {errors[name] ? (
          <p className="field-hint text-negative">{errors[name]}</p>
        ) : null}
      </div>
    );
  };

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="buildingId" value={buildingId} />
      {unit?.id ? <input type="hidden" name="id" value={unit.id} /> : null}

      <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="sr-only">{labels.unitNumber}</legend>
        {field("unitNumber", labels.unitNumber, { required: true, placeholder: "35" })}
        {field("floor", labels.floor, { placeholder: "7" })}
        {field("titleDeedNo", labels.titleDeed, { placeholder: "2423502100", dir: "ltr" })}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="panel-title mb-1">{labels.hasParking}</legend>
        <label className="flex h-[38px] cursor-pointer items-center gap-2.5 self-start rounded-[10px] border border-line-strong bg-surface px-3">
          <input
            type="checkbox"
            name="hasParking"
            defaultChecked={unit?.hasParking ?? false}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-[14px]">{labels.hasParking}</span>
        </label>
        {field("parkingCardNo", labels.parkingCard, { placeholder: "كرت للمواقف" })}
        <div className="sm:col-span-2 lg:col-span-1" />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="panel-title mb-1">{labels.electricityMeter}</legend>
        {field("electricityMeterNo", labels.electricityMeter, { dir: "ltr" })}
        {field("waterMeterNo", labels.waterMeter, { dir: "ltr" })}
        <div className="sm:col-span-2 lg:col-span-1" />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="panel-title mb-1">{labels.owner}</legend>
        {field("ownerName", labels.owner, { placeholder: "محمد الأحمد" })}
        {field("ownerPhone", labels.ownerPhone, {
          type: "tel",
          dir: "ltr",
          placeholder: "05XXXXXXXX",
          inputMode: "tel",
        })}
        {field("rentalDeed", labels.rentalDeed, { placeholder: "ejari-2026-0001" })}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="panel-title mb-1">{labels.tenant}</legend>
        {field("tenantName", labels.tenant, { placeholder: "عبدالله الحربي" })}
        {field("tenantPhone", labels.tenantPhone, {
          type: "tel",
          dir: "ltr",
          placeholder: "05XXXXXXXX",
          inputMode: "tel",
        })}
        <div className="sm:col-span-2 lg:col-span-1" />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="panel-title mb-1">{labels.area}</legend>
        {field("unitArea", labels.area, {
          type: "number",
          step: "0.01",
          min: "0",
          placeholder: "145.50",
        })}
        {field("annualFee", labels.annualFee, {
          type: "number",
          step: "0.01",
          min: "0",
          required: true,
          placeholder: "3000",
        })}
        {field("additionalFees", labels.additionalFees, {
          type: "number",
          step: "0.01",
          min: "0",
          placeholder: "0",
        })}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
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
