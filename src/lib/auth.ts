import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { store } from "@/lib/store";
import type { SessionUser, UserRecord } from "@/lib/types";

export const SESSION_COOKIE = "bms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEMO_PASSWORD = "123456";

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "bms-rentflow-development-secret-change-in-production",
  );
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    buildingId: user.buildingId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "USER",
      buildingId: payload.buildingId ? String(payload.buildingId) : null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** يضمن أن المستخدم الإداري أو المشرفмож من الوصول إلى برج آخر. */
export async function requireBuildingAccess(buildingId: string): Promise<SessionUser> {
  const session = await requireUser();
  if (session.role === "ADMIN") return session;
  if (session.buildingId !== buildingId) redirect("/");
  return session;
}

export type SignInResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function verifyCredentials(email: string, password: string): Promise<SignInResult> {
  const user: UserRecord | null = await store().findUserByEmail(email.trim());
  if (!user) return { ok: false, error: "AUTH_INVALID" };

  const valid = user.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : password === DEMO_PASSWORD;

  if (!valid) return { ok: false, error: "AUTH_INVALID" };

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      buildingId: user.buildingId,
    },
  };
}
