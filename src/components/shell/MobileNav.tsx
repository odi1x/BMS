"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { signOutAction } from "@/app/actions/session";
import { ProductMark } from "./ProductMark";
import { NavLinks, type NavGroup } from "./NavLinks";
import type { ScopeOption } from "./AppShell";

export function MobileNav({
  groups,
  title,
  scope,
  scopeLabel,
  signOutLabel,
  openLabel,
  closeLabel,
  mainLabel,
}: {
  groups: NavGroup[];
  title: string;
  scope: { label: string; options?: ScopeOption[] };
  scopeLabel: string;
  signOutLabel: string;
  openLabel: string;
  closeLabel: string;
  mainLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="no-print sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-line bg-ground px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <ProductMark size={22} />
          <span className="truncate text-[14px] font-semibold">{title}</span>
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-sm ms-auto h-9 w-9 p-0"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? (
            <X size={18} strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <span aria-hidden="true" className="flex flex-col gap-[4px]">
              <span className="block h-[1.5px] w-4 bg-current" />
              <span className="block h-[1.5px] w-4 bg-current" />
              <span className="block h-[1.5px] w-4 bg-current" />
            </span>
          )}
          <span className="sr-only">{open ? closeLabel : openLabel}</span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          ref={panelRef}
          className="no-print fixed inset-x-0 bottom-0 top-12 z-30 overflow-y-auto border-t border-line bg-ground px-4 pb-10 pt-5"
        >
          {scope.options && scope.options.length > 0 ? (
            <div className="mb-5">
              <p className="nav-group-label mt-0">{scopeLabel}</p>
              <ul className="flex flex-col gap-0.5">
                {scope.options.map((option) => (
                  <li key={option.href}>
                    <Link
                      href={option.href}
                      onClick={() => setOpen(false)}
                      className="nav-link"
                      aria-current={option.current ? "page" : undefined}
                    >
                      <span className="flex-1 truncate">{option.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <NavLinks groups={groups} mainLabel={mainLabel} />

          <form action={signOutAction} className="mt-6">
            <button type="submit" className="btn btn-secondary btn-sm">
              {signOutLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
