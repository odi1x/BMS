import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AvatarUpload } from "@/components/users/AvatarUpload";
import { NewUserForm } from "@/components/users/NewUserForm";
import { AppShell, type NavGroup, type ScopeOption } from "@/components/shell/AppShell";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { StatusPill } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { imageKitConfigured } from "@/lib/imagekit";
import { getLocale } from "@/lib/preferences";
import { tenantStore } from "@/lib/store";

export const metadata: Metadata = { title: "المستخدمون" };

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect("/");

  const query = await searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);

  const data = tenantStore(session);
  const [users, buildings] = await Promise.all([data.listUsers(), data.listBuildings()]);
  const buildingName = new Map(buildings.map((building) => [building.id, building.name]));
  const showForm = query.new === "1";
  const imageKitReady = imageKitConfigured();

  const admins = users.filter((user) => user.role === "ADMIN").length;
  const managers = users.length - admins;

  const groups: NavGroup[] = [
    {
      label: dict["nav.overview"],
      items: [
        { href: "/", label: dict["nav.overview"], icon: "dashboard" },
        { href: "/users", label: dict["nav.users"], icon: "users" },
      ],
    },
  ];

  const scopeOptions: ScopeOption[] = (
    await data.listBuildings()
  ).map((row) => ({ label: row.name, href: `/buildings/${row.id}` }));

  return (
    <AppShell
      user={session}
      groups={groups}
      scope={{
        label: dict["nav.allAssociations"],
        href: "/",
        options: scopeOptions,
      }}
    >
      <PageHeader
        title={dict["users.title"]}
        finding={dict["users.subtitle"]}
        actions={
          <Link href={showForm ? "/users" : "/users?new=1"} className="btn btn-primary">
            <Plus size={16} strokeWidth={1.7} aria-hidden="true" />
            {dict["users.add"]}
          </Link>
        }
      />

      <MetricStrip
        items={[
          {
            label: dict["users.total"],
            value: String(users.length),
            answer: true,
          },
          { label: dict["users.roleAdmin"], value: String(admins) },
          { label: dict["users.roleBuilding"], value: String(managers) },
          { label: dict["users.buildingsCount"], value: String(buildings.length) },
        ]}
      />

      {showForm ? (
        <div className="mt-6">
          <Panel title={dict["users.add"]} hint={dict["users.subtitle"]}>
            <NewUserForm
              buildings={buildings.map((building) => ({ id: building.id, name: building.name }))}
              labels={{
                name: dict["users.name"],
                email: dict["users.email"],
                password: dict["users.password"],
                role: dict["users.role"],
                roleAdmin: dict["users.roleAdmin"],
                roleBuilding: dict["users.roleBuilding"],
                building: dict["users.building"],
                noBuilding: dict["users.noBuilding"],
                create: dict["users.create"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      <Panel title={dict["users.listTitle"]} hint={dict["users.listHint"]}>
        <div className="-mx-5 overflow-x-auto">
          <table className={`data-table ${imageKitReady ? "min-w-[720px]" : "min-w-[560px]"}`}>
            <thead>
              <tr>
                <th>{dict["users.name"]}</th>
                <th>{dict["users.email"]}</th>
                <th>{dict["users.role"]}</th>
                <th>{dict["users.building"]}</th>
                {imageKitReady ? <th>{dict["users.avatar"]}</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-9 w-9 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-sunk text-[12px] text-ink-muted">
                          {user.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="font-medium">{user.name}</span>
                    </span>
                  </td>
                  <td className="num text-ink-muted" dir="ltr">
                    {user.email}
                  </td>
                  <td>
                    <StatusPill tone={user.role === "ADMIN" ? "positive" : "neutral"}>
                      {user.role === "ADMIN" ? dict["users.roleAdmin"] : dict["users.roleBuilding"]}
                    </StatusPill>
                  </td>
                  <td className="text-ink-muted">
                    {user.buildingId ? (buildingName.get(user.buildingId) ?? "·") : dict["users.noBuilding"]}
                  </td>
                  {imageKitReady ? (
                    <td>
                      <AvatarUpload
                        userId={user.id}
                        avatarUrl={user.avatarUrl}
                        label={dict["settings.upload"]}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title={dict["users.capabilities"]}
        hint={dict["users.capabilitiesHint"]}
        className="mt-4"
      >
        <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
          <section>
            <h3 className="text-[13px] font-semibold">
              {dict["users.roleAdmin"]} · <span className="num">{admins}</span>
            </h3>
            <ul className="mt-2 flex flex-col gap-2.5 text-[13px]">
              {[
                dict["users.capAdmin1"],
                dict["users.capAdmin2"],
                dict["users.capAdmin3"],
                dict["users.capAdmin4"],
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-line-strong"
                    aria-hidden="true"
                  />
                  <span className="text-ink-muted">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="lg:border-s lg:border-divider lg:ps-6">
            <h3 className="text-[13px] font-semibold">
              {dict["users.roleBuilding"]} · <span className="num">{managers}</span>
            </h3>
            <ul className="mt-2 flex flex-col gap-2.5 text-[13px]">
              {[
                dict["users.capBuilding1"],
                dict["users.capBuilding2"],
                dict["users.capBuilding3"],
                dict["users.capBuilding4"],
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-line-strong"
                    aria-hidden="true"
                  />
                  <span className="text-ink-muted">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Panel>
    </AppShell>
  );
}
