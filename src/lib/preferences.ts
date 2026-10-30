import "server-only";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/format";

export const LOCALE_COOKIE = "bms_locale";
export const THEME_COOKIE = "bms_theme";

export type Theme = "light" | "dark";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "ar";
}

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  return value === "dark" ? "dark" : "light";
}
