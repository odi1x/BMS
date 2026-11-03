import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { signOutAction } from "@/app/actions/session";
import { getDict } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/preferences";
import type { SessionUser } from "@/lib/types";
import { MobileNav } from "./MobileNav";
import { NavLinks, type NavGroup } from "./NavLinks";
import { LanguageToggle, ThemeToggle } from "./PreferencesControls";
import { ProductMark } from "./ProductMark";

export type { NavGroup, NavItem } from "./NavLinks";

export type ScopeOption = {
  label: string;
  href: string;
  current?: boolean;
};

export type ShellProps = {
  user: SessionUser;
  groups: NavGroup[];
  scope: {
    label: string;
    meta?: string;
    href: string;
    options?: ScopeOption[];
  };
  children: React.ReactNode;
};

export async function AppShell({ user, groups, scope, children }: ShellProps) {
  const locale = await getLocale();
  const theme = await getTheme();
  const dict = getDict(locale);
  const options = scope.options ?? [];

  const scopeBody = (
    <>
      <span className="block text-[11px] text-ink-faint">{dict["product.scope"]}</span>
      <span className="mt-0.5 flex items-center gap-1.5">
        <span className="truncate text-[13px] font-medium text-ink">{scope.label}</span>
        {options.length > 0 ? (
          <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
        ) : null}
      </span>
      {scope.meta ? (
        <span className="mt-0.5 block truncate text-[11px] text-ink-faint">{scope.meta}</span>
      ) : null}
    </>
  );

  return (
    <div className="shell">
      <aside className="sidebar no-print flex flex-col">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
          <ProductMark />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {dict["product.name"]}
          </span>
        </Link>

        <div className="mt-4 px-2">
          {options.length > 0 ? (
            <details className="scope-menu relative">
              <summary className="scope-switch list-none cursor-pointer">{scopeBody}</summary>
              <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] border border-line bg-surface">
                <ul className="py-1">
                  {options.map((option) => (
                    <li key={option.href}>
                      <Link
                        href={option.href}
                        className="block px-3 py-2 text-[13px] text-ink-muted no-underline transition-colors duration-100 hover:bg-sunk hover:text-ink"
                        aria-current={option.current ? "page" : undefined}
                      >
                        {option.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ) : (
            <Link href={scope.href} className="scope-switch">
              {scopeBody}
            </Link>
          )}
        </div>

        <div className="sidebar-nav mt-5 flex-1">
          <NavLinks groups={groups} mainLabel={dict["nav.main"]} />
        </div>

        <div className="mt-6 border-t border-divider px-2 pt-3">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-[11px] text-ink-faint">
            {user.role === "ADMIN" ? dict["nav.admin"] : dict["nav.manager"]}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <LanguageToggle locale={locale} label={dict["common.language"]} />
              <ThemeToggle theme={theme} label={dict["common.theme"]} />
            </div>
            <form action={signOutAction}>
              <button type="submit" className="btn btn-ghost btn-sm w-full justify-center">
                {dict["nav.signOut"]}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <MobileNav
          groups={groups}
          title={scope.label}
          scope={{ label: scope.label, options }}
          scopeLabel={dict["nav.allAssociations"]}
          signOutLabel={dict["nav.signOut"]}
          openLabel={dict["nav.openMenu"]}
          closeLabel={dict["nav.closeMenu"]}
          mainLabel={dict["nav.main"]}
        />
        <main className="canvas">{children}</main>
      </div>
    </div>
  );
}
