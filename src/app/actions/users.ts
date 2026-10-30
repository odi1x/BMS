"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { databaseConfigured } from "@/lib/db";
import { tenantDb } from "@/lib/db/tenant";

export type UserActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export const IDLE_USER_STATE: UserActionState = { status: "idle" };

const schema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(80),
  email: z.string().trim().email("بريد إلكتروني غير صحيح").toLowerCase(),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72),
  role: z.enum(["ADMIN", "USER"]),
  buildingId: z.string().trim(),
});

export async function createUserAction(
  _previous: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    return { status: "error", message: "FORBIDDEN" };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    buildingId: formData.get("buildingId") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "FORM_INVALID",
      errors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  if (!databaseConfigured()) {
    return { status: "error", message: "قاعدة البيانات غير مهيأة · السجل التجريبي للقراءة فقط." };
  }

  const buildingId =
    parsed.data.role === "USER" && parsed.data.buildingId
      ? parsed.data.buildingId
      : null;

  if (parsed.data.role === "USER" && !buildingId) {
    return { status: "error", message: "FORM_INVALID", errors: { buildingId: "اختر البرج" } };
  }

  const existing = await tenantDb(session).profile.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      status: "error",
      message: "FORM_INVALID",
      errors: { email: "البريد مسجّل مسبقاً" },
    };
  }

  await tenantDb(session).profile.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: parsed.data.role,
      buildingId,
    },
  });

  revalidatePath("/users");

  return { status: "ok" };
}
