import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NewBuildingForm } from "@/components/buildings/NewBuildingForm";
import { AppShell, type NavGroup } from "@/components/shell/AppShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import { isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "تسجيل برج جديد" };

export default async function NewBuildingPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");

  const locale = await getLocale();
  const dict = getDict(locale);

  const groups: NavGroup[] = [
    {
      label: dict["nav.overview"],
      items: [
        { href: "/", label: dict["nav.overview"], icon: "dashboard" },
        { href: "/users", label: dict["nav.users"], icon: "users" },
      ],
    },
  ];

  return (
    <AppShell
      user={user}
      groups={groups}
      scope={{ label: dict["buildings.new"], href: "/buildings/new" }}
    >
      <PageHeader
        title={dict["buildings.createTitle"]}
        finding={dict["buildings.createSubtitle"]}
        actions={
          <Link href="/" className="btn btn-secondary">
            <ArrowLeft size={16} strokeWidth={1.7} aria-hidden="true" />
            {dict["common.back"]}
          </Link>
        }
      />

      {isDemoMode() ? <DemoBanner message={dict["common.demoReadOnly"]} /> : null}

      <Panel title={dict["buildings.formTitle"]} hint={dict["buildings.formHint"]}>
        <NewBuildingForm
          labels={{
            name: dict["settings.name"],
            registrationNo: dict["settings.registrationNo"],
            unifiedId: dict["settings.unifiedId"],
            chairmanName: dict["settings.chairmanName"],
            address: dict["settings.address"],
            iban: dict["settings.iban"],
            create: dict["buildings.create"],
            saving: dict["common.saving"],
            saved: dict["common.saved"],
            required: dict["auth.required"],
            stampLater: dict["buildings.stampLater"],
          }}
        />
      </Panel>
    </AppShell>
  );
}
