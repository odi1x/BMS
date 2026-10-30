"use client";

import { useActionState } from "react";
import { createBuildingAction, IDLE_STATE } from "@/app/actions/records";

export function NewBuildingForm({
  labels,
}: {
  labels: {
    name: string;
    registrationNo: string;
    unifiedId: string;
    chairmanName: string;
    address: string;
    iban: string;
    create: string;
    saving: string;
    saved: string;
    required: string;
    stampLater: string;
  };
}) {
  const [state, formAction, pending] = useActionState(createBuildingAction, IDLE_STATE);
  const errors = state.errors ?? {};

  const field = (
    name: string,
    label: string,
    options: { required?: boolean; placeholder?: string; dir?: "ltr"; span?: string } = {},
  ) => (
    <div className={options.span ?? ""}>
      <label className="field-label" htmlFor={`building-${name}`}>
        {label}
        {options.required ? <span className="text-negative"> *</span> : null}
      </label>
      <input
        id={`building-${name}`}
        name={name}
        className="input"
        defaultValue=""
        placeholder={options.placeholder}
        required={options.required}
        dir={options.dir}
      />
      {errors[name] ? <p className="field-hint text-negative">{errors[name]}</p> : null}
    </div>
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", labels.name, {
          required: true,
          placeholder: "جمعية ملاك برج الوفاء السكني",
          span: "sm:col-span-2",
        })}
        {field("registrationNo", labels.registrationNo, { placeholder: "2423502100", dir: "ltr" })}
        {field("unifiedId", labels.unifiedId, { placeholder: "7051508831", dir: "ltr" })}
        {field("chairmanName", labels.chairmanName, { placeholder: "جمال محمد المرزوقي" })}
        {field("address", labels.address, {
          placeholder: "مكة المكرمة - العزيزية - طريق الطائف",
        })}
        <div className="sm:col-span-2">
          {field("iban", labels.iban, {
            placeholder: "SA8010000067700000562109",
            dir: "ltr",
          })}
        </div>
      </div>

      <p className="text-[13px] text-ink-faint">{labels.stampLater}</p>

      <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? labels.saving : labels.create}
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
