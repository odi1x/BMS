"use client";

import { useTransition } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { setLocale, setTheme } from "@/app/actions/preferences";
import type { Locale } from "@/lib/format";
import type { Theme } from "@/lib/preferences";

export function LanguageToggle({ locale, label }: { locale: Locale; label: string }) {
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => startTransition(() => setLocale(next))}
      disabled={pending}
      aria-label={label}
      lang={next}
    >
      <Languages size={15} strokeWidth={1.6} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export function ThemeToggle({ theme, label }: { theme: Theme; label: string }) {
  const [pending, startTransition] = useTransition();
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => startTransition(() => setTheme(next))}
      disabled={pending}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? (
        <Sun size={15} strokeWidth={1.6} aria-hidden="true" />
      ) : (
        <Moon size={15} strokeWidth={1.6} aria-hidden="true" />
      )}
    </button>
  );
}
