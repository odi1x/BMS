"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  House,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavIconName =
  | "dashboard"
  | "buildings"
  | "units"
  | "revenues"
  | "expenses"
  | "financial"
  | "users"
  | "settings";

const ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  buildings: Building2,
  units: House,
  revenues: Receipt,
  expenses: Wallet,
  financial: FileText,
  users: Users,
  settings: Settings,
};

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  count?: number;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

function LinkPending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden data-pending={pending ? "true" : "false"} />;
}

export function NavLinks({
  groups,
  mainLabel = "التنقل الرئيسي",
}: {
  groups: NavGroup[];
  mainLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={mainLabel}>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="nav-group-label">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                item.href === pathname ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              const Icon = ICONS[item.icon] ?? LayoutDashboard;

              return (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link" data-active={active}>
                    <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.count ? (
                      <span className="nav-count num">{item.count}</span>
                    ) : null}
                    <LinkPending />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
