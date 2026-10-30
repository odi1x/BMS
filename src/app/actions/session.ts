"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function signInAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "AUTH_REQUIRED" };

  const result = await verifyCredentials(email, password);
  if (!result.ok) return { error: result.error };

  await createSession(result.user);
  redirect(result.user.role === "ADMIN" ? "/" : `/buildings/${result.user.buildingId}`);
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
