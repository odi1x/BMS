"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signInAction, type LoginState } from "@/app/actions/session";

const initialState: LoginState = { error: null };

export function LoginForm({
  emailLabel,
  passwordLabel,
  signInLabel,
  savingLabel,
  invalidLabel,
  requiredLabel,
}: {
  emailLabel: string;
  passwordLabel: string;
  signInLabel: string;
  savingLabel: string;
  invalidLabel: string;
  requiredLabel: string;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label" htmlFor="email">
          {emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          dir="ltr"
          className="input"
          placeholder="admin@rentflow.sa"
          required
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          {passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          className="input"
          placeholder="••••••"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-[13px] text-negative-ink">
          {state.error === "AUTH_REQUIRED" ? requiredLabel : invalidLabel}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        <LogIn size={16} strokeWidth={1.7} aria-hidden="true" />
        {pending ? savingLabel : signInLabel}
      </button>
    </form>
  );
}
