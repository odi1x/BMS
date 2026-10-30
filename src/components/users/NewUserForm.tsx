"use client";

import { useActionState } from "react";
import { createUserAction, IDLE_USER_STATE } from "@/app/actions/users";

export function NewUserForm({
  buildings,
  labels,
}: {
  buildings: { id: string; name: string }[];
  labels: {
    name: string;
    email: string;
    password: string;
    role: string;
    roleAdmin: string;
    roleBuilding: string;
    building: string;
    noBuilding: string;
    create: string;
    saving: string;
    saved: string;
    required: string;
  };
}) {
  const [state, formAction, pending] = useActionState(createUserAction, IDLE_USER_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" noValidate>
      <div>
        <label className="field-label" htmlFor="userName">
          {labels.name}
        </label>
        <input id="userName" name="name" className="input" required />
        {errors.name ? <p className="field-hint text-negative">{errors.name}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="userEmail">
          {labels.email}
        </label>
        <input id="userEmail" name="email" type="email" className="input num" dir="ltr" required />
        {errors.email ? <p className="field-hint text-negative">{errors.email}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="userPassword">
          {labels.password}
        </label>
        <input
          id="userPassword"
          name="password"
          type="password"
          className="input num"
          dir="ltr"
          minLength={6}
          required
        />
        {errors.password ? <p className="field-hint text-negative">{errors.password}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="userRole">
          {labels.role}
        </label>
        <select id="userRole" name="role" className="select" defaultValue="USER">
          <option value="USER">{labels.roleBuilding}</option>
          <option value="ADMIN">{labels.roleAdmin}</option>
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="userBuilding">
          {labels.building}
        </label>
        <select id="userBuilding" name="buildingId" className="select" defaultValue="">
          <option value="">{labels.noBuilding}</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
        {errors.buildingId ? <p className="field-hint text-negative">{errors.buildingId}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? labels.saving : labels.create}
        </button>
        {state.status === "error" ? (
          <p className="text-[13px] text-negative">
            {state.message === "FORM_INVALID" ? labels.required : state.message}
          </p>
        ) : null}
        {state.status === "ok" ? (
          <p className="text-[13px] text-accent-ink">{labels.create} · {labels.saved}</p>
        ) : null}
      </div>
    </form>
  );
}
