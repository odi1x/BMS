import type { FieldErrors } from "@/lib/validation";

export type ActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const IDLE_STATE: ActionState = { status: "idle" };

export type UserActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export const IDLE_USER_STATE: UserActionState = { status: "idle" };

export type ImageActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export const IDLE_IMAGE_STATE: ImageActionState = { status: "idle" };
