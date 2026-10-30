import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { store } from "@/lib/store";

/**
 * مساعد تطوير فقط: ينشئ جلسة للتجربة السريعة (فحص بصري، لقطات شاشة).
 * معطّل تماماً في بيئة الإنتاج.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "admin@rentflow.sa";
  const target = url.searchParams.get("to") ?? "/";

  const user = await store().findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    buildingId: user.buildingId,
  });

  return NextResponse.redirect(new URL(target, request.url));
}
