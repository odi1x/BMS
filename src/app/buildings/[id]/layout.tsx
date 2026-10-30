import { notFound } from "next/navigation";
import { AppShell, type NavGroup, type ScopeOption } from "@/components/shell/AppShell";
import { requireBuildingAccess } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import { tenantStore } from "@/lib/store";

export default async function BuildingLayout({
  children,
  params,
}: LayoutProps<"/buildings/[id]">) {
  const { id } = await params;
  const user = await requireBuildingAccess(id);

  const building = await tenantStore(user).getBuilding(id);
  if (!building) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);

  const groups: NavGroup[] = [
    {
      label: dict["nav.records"],
      items: [
        { href: `/buildings/${id}`, label: dict["nav.dashboard"], icon: "dashboard" },
        { href: `/buildings/${id}/units`, label: dict["nav.units"], icon: "units" },
        { href: `/buildings/${id}/revenues`, label: dict["nav.revenues"], icon: "revenues" },
        { href: `/buildings/${id}/expenses`, label: dict["nav.expenses"], icon: "expenses" },
        {
          href: `/buildings/${id}/financial-summary`,
          label: dict["nav.financial"],
          icon: "financial",
        },
      ],
    },
    {
      label: dict["nav.settings"],
      items: [
        { href: `/buildings/${id}/settings`, label: dict["nav.association"], icon: "settings" },
      ],
    },
  ];

  let options: ScopeOption[] = [];
  if (user.role === "ADMIN") {
    const all = await tenantStore(user).listBuildings();
    options = [
      { label: dict["nav.allAssociations"], href: "/" },
      ...all.map((row) => ({
        label: row.name,
        href: `/buildings/${row.id}`,
        current: row.id === id,
      })),
    ];
  }

  return (
    <AppShell
      user={user}
      groups={groups}
      scope={{
        label: building.name,
        meta: building.registrationNo ?? undefined,
        href: `/buildings/${id}`,
        options,
      }}
    >
      {children}
    </AppShell>
  );
}
