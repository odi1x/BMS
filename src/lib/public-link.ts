import "server-only";

import { SignJWT, jwtVerify } from "jose";

/**
 * روابط تنزيل عامة موقّعة — تُستخدم في الرسائل المُرسلة بالبريد
 * حتى يتمكن المستلم من فتح ملف PDF دون امتلاك حساب في النظام.
 */

export type PublicScope = "statement" | "voucher";

export type PublicClaims = {
  buildingId: string;
  scope: PublicScope;
  year?: number;
  month?: number;
  voucherId?: string;
};

const TTL_SECONDS = 60 * 60 * 24 * 7;

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "bms-rentflow-development-secret-change-in-production",
  );
}

export async function signPublicLink(claims: PublicClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyPublicLink(
  token: string,
  scope: PublicScope,
): Promise<PublicClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.scope !== scope) return null;
    if (typeof payload.buildingId !== "string") return null;

    const claims: PublicClaims = {
      buildingId: payload.buildingId,
      scope,
    };
    if (typeof payload.year === "number") claims.year = payload.year;
    if (typeof payload.month === "number") claims.month = payload.month;
    if (typeof payload.voucherId === "string") claims.voucherId = payload.voucherId;

    return claims;
  } catch {
    return null;
  }
}
