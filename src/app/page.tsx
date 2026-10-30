import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Building2, Plus, TriangleAlert } from "lucide-react";
import { AppShell, type NavGroup, type ScopeOption } from "@/components/shell/AppShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { Money } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { requireUser } from "@/lib/auth";
import { currencyUnit, formatMoney, round2 } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import { resolvePeriod } from "@/lib/period";
import { loadAllSnapshots } from "@/lib/queries";
import { isDemoMode, tenantStore } from "@/lib/store";

export const metadata: Metadata = { title: "نظرة عامة" };

export default async function AdminOverviewPage({
  searchParams,
}: PageProps<"/">) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect(`/buildings/${user.buildingId}`);

  const query = await searchParams;
  const period = resolvePeriod(query);

  const locale = await getLocale();
  const dict = getDict(locale);
  const currency = currencyUnit(locale);
  const snapshots = await loadAllSnapshots(user, period.year, period.month);

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
    await tenantStore(user).listBuildings()
  ).map((row) => ({ label: row.name, href: `/buildings/${row.id}` }));

  const totals = {
    revenue: round2(snapshots.reduce((sum, item) => sum + item.monthRevenueTotal, 0)),
    expenses: round2(snapshots.reduce((sum, item) => sum + item.monthExpenseTotal, 0)),
    outstanding: round2(
      snapshots.reduce((sum, item) => sum + item.settlementSummary.outstanding, 0),
    ),
    units: snapshots.reduce((sum, item) => sum + item.units.length, 0),
    unsettled: snapshots.reduce(
      (sum, item) => sum + item.settlementSummary.unpaid + item.settlementSummary.partial,
      0,
    ),
  };

  const periodEnd = new Date(Date.UTC(period.year, period.month, 0));

  const attention = snapshots.flatMap((snapshot) => {
    const items: Array<{ title: string; detail: string; href: string }> = [];

    if (snapshot.settlementSummary.outstanding > 0) {
      items.push({
        title: snapshot.building.name,
        detail: `${snapshot.settlementSummary.unpaid + snapshot.settlementSummary.partial} ${dict["dashboard.unpaidUnits"]} · ${formatMoney(snapshot.settlementSummary.outstanding)} ${currency}`,
        href: `/buildings/${snapshot.building.id}/revenues?year=${period.year}&month=${period.month}`,
      });
    }

    for (const contract of snapshot.contracts) {
      const due = contract.nextDueDate ? new Date(contract.nextDueDate) : null;
      if (due && due < periodEnd) {
        items.push({
          title: contract.title,
          detail: `${snapshot.building.name} · ${dict["expenses.nextDue"]} ${due.toISOString().slice(0, 10)} · ${dict["expenses.balance"]} ${formatMoney(contract.balanceDue ?? 0)} ${currency}`,
          href: `/buildings/${snapshot.building.id}/expenses?year=${period.year}&month=${period.month}`,
        });
      }
    }

    return items;
  });

  const attentionTotal = round2(
    snapshots.reduce(
      (sum, snapshot) =>
        sum +
        snapshot.settlementSummary.outstanding +
        snapshot.contracts
          .filter(
            (contract) =>
              contract.nextDueDate && new Date(contract.nextDueDate) < periodEnd,
          )
          .reduce((contractSum, contract) => contractSum + (contract.balanceDue ?? 0), 0),
      0,
    ),
  );

  return (
    <AppShell
      user={user}
      groups={groups}
      scope={{
        label: dict["nav.allAssociations"],
        href: "/",
        options: scopeOptions,
      }}
    >
      <PageHeader
        title={dict["dashboard.title"]}
        finding={
          totals.unsettled > 0 ? (
            <>
              <span className="num">{totals.unsettled}</span> {dict["dashboard.unpaidUnits"]} ·{" "}
              <span className="num">{formatMoney(totals.outstanding)}</span>{" "}
              <span className="text-ink-faint">{currency}</span> {dict["common.outstanding"]}
            </>
          ) : (
            dict["settlement.allUnits"]
          )
        }
        actions={
          <Link href="/buildings/new" className="btn btn-primary">
            <Plus size={16} strokeWidth={1.7} aria-hidden="true" />
            {dict["buildings.new"]}
          </Link>
        }
      />

      {isDemoMode() ? <DemoBanner message={dict["common.demoReadOnly"]} /> : null}

      <Suspense fallback={null}>
        <PeriodPicker
          period={period}
          labels={{
            fiscalYear: dict["common.fiscalYear"],
            month: dict["common.month"],
            locale,
          }}
        />
      </Suspense>

      <MetricStrip
        items={[
          {
            label: dict["common.outstanding"],
            value: formatMoney(totals.outstanding),
            unit: currency,
            answer: true,
            hint: `${totals.unsettled} ${dict["dashboard.unpaidUnits"]}`,
          },
          {
            label: dict["dashboard.towerRevenue"],
            value: formatMoney(totals.revenue),
            unit: currency,
            hint: `${dict["common.period"]}: ${dict["dashboard.month"]}`,
          },
          {
            label: dict["dashboard.towerExpenses"],
            value: formatMoney(totals.expenses),
            unit: currency,
          },
          {
            label: dict["dashboard.towerNet"],
            value: formatMoney(round2(totals.revenue - totals.expenses)),
            unit: currency,
            hint: `${totals.units} ${dict["common.units"]}`,
          },
        ]}
      />

      <Panel
        title={dict["dashboard.towers"]}
        hint={dict["dashboard.subtitle"]}
        className="min-w-0"
      >
          <div className="-mx-5 overflow-x-auto">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th className="min-w-[220px]">{dict["dashboard.towers"]}</th>
                  <th className="num">{dict["common.units"]}</th>
                  <th className="num">{dict["dashboard.towerRevenue"]}</th>
                  <th className="num">{dict["dashboard.towerExpenses"]}</th>
                  <th className="num">{dict["dashboard.towerNet"]}</th>
                  <th className="num">{dict["dashboard.towerOutstanding"]}</th>
                  <th aria-label={dict["common.actions"]} />
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot) => {
                  const summary = snapshot.settlementSummary;
                  return (
                    <tr key={snapshot.building.id}>
                      <td>
                        <Link
                          href={`/buildings/${snapshot.building.id}?year=${period.year}&month=${period.month}`}
                          className="font-medium text-ink no-underline hover:underline"
                        >
                          {snapshot.building.name}
                        </Link>
                        <span className="mt-0.5 block text-[12px] text-ink-faint">
                          {snapshot.building.chairmanName} · {snapshot.building.registrationNo}
                        </span>
                      </td>
                      <td className="num">
                        {summary.units}
                        {summary.unpaid + summary.partial > 0 ? (
                          <span className="mt-0.5 block text-[12px] text-negative">
                            {summary.unpaid + summary.partial} {dict["dashboard.unpaidUnits"]}
                          </span>
                        ) : null}
                      </td>
                      <td className="num">
                        <Money value={snapshot.monthRevenueTotal} unit={currency} />
                      </td>
                      <td className="num">
                        <Money value={snapshot.monthExpenseTotal} unit={currency} />
                      </td>
                      <td
                        className="num font-medium"
                        style={{
                          color:
                            snapshot.net >= 0 ? "var(--accent-ink)" : "var(--negative-ink)",
                        }}
                      >
                        {snapshot.net >= 0 ? "+" : ""}
                        {formatMoney(snapshot.net)}
                      </td>
                      <td className="num">
                        {summary.outstanding > 0 ? (
                          <Money value={summary.outstanding} unit={currency} />
                        ) : (
                          <span className="text-ink-faint">·</span>
                        )}
                      </td>
                      <td className="text-end">
                        <Link
                          href={`/buildings/${snapshot.building.id}?year=${period.year}&month=${period.month}`}
                          className="btn btn-ghost btn-sm"
                          aria-label={`${dict["dashboard.towerOpen"]} · ${snapshot.building.name}`}
                        >
                          <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {snapshots.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 border-t border-divider pt-6 text-center">
              <Building2 size={22} strokeWidth={1.5} aria-hidden="true" className="text-ink-faint" />
              <p className="text-[14px] text-ink-muted">{dict["common.empty"]}</p>
              <Link href="/buildings/new" className="btn btn-secondary btn-sm">
                <Plus size={15} strokeWidth={1.7} aria-hidden="true" />
                {dict["buildings.new"]}
              </Link>
            </div>
          ) : null}
      </Panel>

      <Panel
        title={dict["dashboard.movementTitle"]}
        hint={dict["dashboard.finding"]}
        className="mt-4"
      >
        <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
          <section>
            <h3 className="text-[13px] font-semibold">{dict["dashboard.collectionRate"]}</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {snapshots.map((snapshot) => (
                <li key={snapshot.building.id} className="flex items-center gap-3">
                  <span className="w-[130px] shrink-0 truncate text-[12px] text-ink-muted">
                    {snapshot.building.name}
                  </span>
                  <span className="track flex-1">
                    <span
                      className="track-fill"
                      style={{ width: `${snapshot.settlementSummary.collectionRate}%` }}
                    />
                  </span>
                  <span className="num w-[46px] shrink-0 text-end text-[12px] text-ink">
                    {snapshot.settlementSummary.collectionRate}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-divider pt-3 text-[13px] text-ink-muted">
              {dict["dashboard.expensesByTower"]} ·{" "}
              <span className="num text-ink">
                {formatMoney(
                  snapshots.reduce((sum, snapshot) => sum + snapshot.monthExpenseTotal, 0),
                )}
              </span>{" "}
              <span className="text-ink-faint">{currency}</span>
            </p>
          </section>

          <section className="lg:border-s lg:border-divider lg:ps-6">
            <h3 className="text-[13px] font-semibold">{dict["dashboard.attention"]}</h3>
            {attention.length === 0 ? (
              <p className="mt-3 text-[14px] text-ink-muted">{dict["building.noContracts"]}</p>
            ) : (
              <ul className="mt-1 flex flex-col">
                {attention.map((item) => (
                  <li
                    key={`${item.href}-${item.title}`}
                    className="border-b border-divider last:border-b-0"
                  >
                    <Link
                      href={item.href}
                      className="flex items-start gap-2.5 py-2.5 text-inherit no-underline"
                    >
                      <TriangleAlert
                        size={15}
                        strokeWidth={1.7}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-negative"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-ink">{item.title}</span>
                        <span className="block text-[12px] leading-relaxed text-ink-muted">
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-divider pt-3 text-[12px] text-ink-muted">
              <span>
                <span className="num">{attention.length}</span> {dict["dashboard.attention"]}
              </span>
              <span className="num text-negative">
                {formatMoney(attentionTotal)} {currency}
              </span>
            </div>
          </section>
        </div>
      </Panel>
    </AppShell>
  );
}
