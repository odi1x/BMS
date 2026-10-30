import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FileText, Receipt, TriangleAlert } from "lucide-react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { SettlementExplorer } from "@/components/settlement/SettlementExplorer";
import { BarList } from "@/components/ui/BarList";
import { Money } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import { resolvePeriod } from "@/lib/period";
import { loadBuildingSnapshot } from "@/lib/queries";
import { currencyUnit, formatDayMonth, formatMoney } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/buildings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id);
  return { title: snapshot?.building.name ?? "برج" };
}

export default async function BuildingOverviewPage({
  params,
  searchParams,
}: PageProps<"/buildings/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const period = resolvePeriod(query);
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id, period.year, period.month);
  if (!snapshot) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);
  const { building, settlementSummary: summary, settlement, monthly } = snapshot;
  const currency = currencyUnit(locale);
  const periodEnd = new Date(Date.UTC(period.year, period.month, 0));

  const floorCount = new Set(settlement.map((row) => row.floor ?? "·")).size;
  const unsettled = summary.unpaid + summary.partial;

  const finding =
    unsettled > 0 ? (
      <>
        <span className="num">{formatMoney(summary.outstanding)}</span>{" "}
        <span className="text-ink-faint">{currency}</span>{" "}
        {dict["common.outstanding"]} · {unsettled} {dict["dashboard.unit"]}
      </>
    ) : (
      dict["settlement.allUnits"]
    );

  const recentVouchers = [...snapshot.monthRevenues]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  const contracts = snapshot.contracts
    .map((contract) => ({
      ...contract,
      overdue:
        contract.nextDueDate !== null && new Date(contract.nextDueDate) < periodEnd,
    }))
    .slice(0, 3);

  const chartLabels = monthly.map((point) => point.label);
  const chartValues = monthly.map((point) => point.revenue);

  return (
    <>
      <PageHeader
        title={building.name}
        finding={finding}
        actions={
          <>
            <Link
              href={`/buildings/${id}/financial-summary?year=${period.year}&month=${period.month}`}
              className="btn btn-secondary"
            >
              <FileText size={16} strokeWidth={1.7} aria-hidden="true" />
              {dict["nav.financial"]}
            </Link>
            <Link
              href={`/buildings/${id}/revenues?new=1&year=${period.year}&month=${period.month}`}
              className="btn btn-primary"
            >
              <Receipt size={16} strokeWidth={1.7} aria-hidden="true" />
              {dict["revenues.newVoucher"]}
            </Link>
          </>
        }
      />

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

      <SettlementExplorer
        units={settlement}
        summary={summary}
        locale={locale}
        currency={currency}
        auditHref={`/buildings/${id}/revenues?year=${period.year}&month=${period.month}`}
        labels={{
          towerTitle: dict["settlement.title"],
          towerHint: `${summary.units} ${dict["settlement.units"]} · ${floorCount} ${dict["settlement.floors"]}`,
          floor: dict["settlement.floor"],
          unit: dict["settlement.unit"],
          paid: dict["settlement.paid"],
          partial: dict["settlement.partial"],
          unpaid: dict["settlement.unpaid"],
          collected: dict["settlement.collected"],
          required: dict["settlement.required"],
          outstanding: dict["settlement.outstanding"],
          rate: dict["settlement.rate"],
          ofRequired: dict["settlement.ofRequired"],
          allUnits: dict["settlement.allUnits"],
          lastPayment: dict["settlement.lastPayment"],
          openAudit: dict["settlement.openAudit"],
          clear: dict["settlement.clear"],
          selectUnit: dict["settlement.selectUnit"],
        }}
      >
        <Panel
          title={dict["dashboard.receiptsTitle"]}
          hint={dict["dashboard.receiptsHint"]}
          action={
            <Link
              href={`/buildings/${id}/revenues?year=${period.year}&month=${period.month}`}
              className="btn btn-ghost btn-sm"
            >
              {dict["common.viewAll"]}
            </Link>
          }
        >
          <ColumnChart
            labels={chartLabels}
            height={168}
            highlightIndex={period.month - 1}
            series={[
              {
                key: "revenue",
                label: dict["dashboard.receiptsTitle"],
                values: chartValues,
              },
            ]}
          />
          <div className="mt-3 flex items-center gap-4 border-t border-divider pt-3 text-[12px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-accent" aria-hidden="true" />
              {dict["dashboard.month"]}
            </span>
            <span className="ms-auto">
              {dict["financial.income"]}{" "}
              <span className="num text-ink">{formatMoney(snapshot.monthRevenueTotal)}</span>{" "}
              <span className="text-ink-faint">{currency}</span>
            </span>
          </div>
          <p className="mt-2 text-[13px] text-ink-muted">
            {dict["financial.expenses"]}{" "}
            <span className="num text-ink">{formatMoney(snapshot.monthExpenseTotal)}</span>{" "}
            <span className="text-ink-faint">{currency}</span> · {dict["financial.net"]}{" "}
            <span className="num text-ink">{formatMoney(snapshot.net)}</span>{" "}
            <span className="text-ink-faint">{currency}</span>
          </p>
        </Panel>

        <Panel
          title={dict["dashboard.expensesTitle"]}
          hint={`${dict["common.period"]}: ${dict["dashboard.month"]}`}
          action={
            <Link
              href={`/buildings/${id}/expenses?year=${period.year}&month=${period.month}`}
              className="btn btn-ghost btn-sm"
            >
              {dict["common.viewAll"]}
            </Link>
          }
        >
          {snapshot.categories.length === 0 ? (
            <p className="text-[14px] text-ink-muted">{dict["common.empty"]}</p>
          ) : (
            <BarList
              unit={currency}
              rows={snapshot.categories.slice(0, 4).map((category) => ({
                label: category.category,
                value: category.amount,
              }))}
            />
          )}
          <p className="mt-3 border-t border-divider pt-3 text-[13px] text-ink-muted">
            <span className="num">{formatMoney(snapshot.monthExpenseTotal)}</span>{" "}
            <span className="text-ink-faint">{currency}</span>
          </p>
        </Panel>

        <Panel
          title={dict["dashboard.movementTitle"]}
          hint={dict["dashboard.movementHint"]}
        >
          <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] font-semibold">{dict["dashboard.recentTitle"]}</h3>
                <Link
                  href={`/buildings/${id}/revenues?year=${period.year}&month=${period.month}`}
                  className="text-[12px] text-ink-faint no-underline hover:text-ink hover:underline"
                >
                  {dict["common.viewAll"]}
                </Link>
              </div>
              {recentVouchers.length === 0 ? (
                <p className="mt-2 text-[14px] text-ink-muted">{dict["common.empty"]}</p>
              ) : (
                <ul className="mt-1 flex flex-col">
                  {recentVouchers.map((voucher) => {
                    const unit = snapshot.units.find((row) => row.id === voucher.unitId);
                    return (
                      <li
                        key={voucher.id}
                        className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-ink">
                            {unit
                              ? `${dict["settlement.unit"]} ${unit.unitNumber}`
                              : dict["common.voucher"]}{" "}
                            <span className="num text-ink-faint">{voucher.voucherNo}</span>
                          </span>
                          <span className="block text-[12px] text-ink-faint">
                            {formatDayMonth(voucher.date, locale)} ·{" "}
                            {voucher.paymentChannel === "CASH"
                              ? dict["revenues.channelCash"]
                              : voucher.paymentChannel === "BANK_TRANSFER"
                                ? dict["revenues.channelBank"]
                                : dict["revenues.channelOther"]}
                          </span>
                        </span>
                        <Money value={voucher.amount} unit={currency} className="text-[13px]" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="lg:border-s lg:border-divider lg:ps-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] font-semibold">{dict["dashboard.contractsTitle"]}</h3>
                <Link
                  href={`/buildings/${id}/expenses?year=${period.year}&month=${period.month}`}
                  className="text-[12px] text-ink-faint no-underline hover:text-ink hover:underline"
                >
                  {dict["common.viewAll"]}
                </Link>
              </div>
              {contracts.length === 0 ? (
                <p className="mt-2 text-[14px] text-ink-muted">{dict["building.noContracts"]}</p>
              ) : (
                <ul className="mt-1 flex flex-col">
                  {contracts.map((contract) => (
                    <li
                      key={contract.id}
                      className="flex items-start gap-2.5 border-b border-divider py-2.5 last:border-b-0"
                    >
                      {contract.overdue ? (
                        <TriangleAlert
                          size={15}
                          strokeWidth={1.7}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-negative"
                        />
                      ) : (
                        <span
                          className="mt-[7px] h-[6px] w-[6px] shrink-0 bg-line-strong"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">
                          {contract.title}
                        </span>
                        <span className="block text-[12px] text-ink-faint">
                          {contract.vendor}
                          {contract.nextDueDate ? (
                            <>
                              {" · "}
                              {dict["expenses.nextDue"]}:{" "}
                              <span className="num">
                                {contract.nextDueDate.toISOString().slice(0, 10)}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </span>
                      <Money
                        value={contract.balanceDue ?? 0}
                        unit={currency}
                        className="text-[13px]"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </Panel>
      </SettlementExplorer>
    </>
  );
}
