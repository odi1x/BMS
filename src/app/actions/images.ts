"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBuildingAccess, requireUser } from "@/lib/auth";
import { removeFromImageKit } from "@/lib/imagekit";
import { isDemoMode } from "@/lib/store";

const schema = z.object({
  target: z.enum(["stamp", "unit-photo", "avatar"]),
  entityId: z.string().min(1),
  fileId: z.string().min(1),
  url: z.string().min(1),
});

export type ImageActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export const IDLE_IMAGE_STATE: ImageActionState = { status: "idle" };

export async function saveImageAction(
  _prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const session = await requireUser();

  const parsed = schema.safeParse({
    target: formData.get("target"),
    entityId: formData.get("entityId"),
    fileId: formData.get("fileId"),
    url: formData.get("url"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "FORM_INVALID",
      errors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  if (isDemoMode()) {
    return { status: "error", message: "قاعدة البيانات غير مهيأة · تعذّر حفظ الصورة." };
  }

  const { target, entityId, fileId, url } = parsed.data;
  const { tenantDb } = await import("@/lib/db/tenant");
  const db = tenantDb(session);

  try {
    if (target === "stamp") {
      await requireBuildingAccess(entityId);
      const previous = await db.building.findUnique({
        where: { id: entityId },
        select: { stampFileId: true },
      });
      await db.building.update({
        where: { id: entityId },
        data: { stampUrl: url, stampFileId: fileId },
      });
      if (previous?.stampFileId && previous.stampFileId !== fileId) {
        await removeFromImageKit(previous.stampFileId).catch(() => undefined);
      }
      revalidatePath(`/buildings/${entityId}/settings`);
      revalidatePath(`/buildings/${entityId}/financial-summary`);
    } else if (target === "unit-photo") {
      const unit = await db.unit.findUnique({
        where: { id: entityId },
        select: { buildingId: true },
      });
      if (!unit) return { status: "error", message: "RECORD_NOT_FOUND" };
      await requireBuildingAccess(unit.buildingId);
      await db.unit.update({ where: { id: entityId }, data: { photoUrl: url } });
      revalidatePath(`/buildings/${unit.buildingId}/units`);
    } else {
      if (session.role !== "ADMIN" && session.id !== entityId) {
        return { status: "error", message: "FORBIDDEN" };
      }
      await db.profile.update({
        where: { id: entityId },
        data: { avatarUrl: url },
      });
      revalidatePath("/users");
    }
  } catch {
    return { status: "error", message: "تعذّر حفظ الصورة." };
  }

  return { status: "ok" };
}
