import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { EmailSendForm } from "@/components/financial/EmailSendForm";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { Money } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { PrintButton } from "@/components/ui/PrintButton";
import { requireUser } from "@/lib/auth";
import { formatDayMonth, formatHijri, formatMoney, formatMonthYear, formatShortDate, monthName , currencyUnit } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { transformedUrl } from "@/lib/imagekit";
import { getLocale } from "@/lib/preferences";
import { resolvePeriod } from "@/lib/period";
import { loadBuildingSnapshot } from "@/lib/queries";
import { isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "التقرير المالي" };

export default async function FinancialSummaryPage({
  params,
  searchParams,
}: PageProps<"/buildings/[id]/financial-summary">) {
  const { id } = await params;
  const query = await searchParams;
  const period = resolvePeriod(query);
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id, period.year, period.month);
  if (!snapshot) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);
  const currency = currencyUnit(locale);
  const { building, monthly } = snapshot;

  const yearRevenue = monthly.reduce((sum, point) => sum + point.revenue, 0);
  const yearExpense = monthly.reduce((sum, point) => sum + point.expenses, 0);

  const labels = monthly.map((point) => point.label);
  const periodLabel = formatMonthYear(period.month, period.year, locale);
  const statementDate = new Date(Date.UTC(period.year, period.month, 0));

  const unitById = new Map(snapshot.units.map((unit) => [unit.id, unit]));
  const revenues = [...snapshot.monthRevenues].sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
    return Number(a.voucherNo) - Number(b.voucherNo);
  });

  return (
    <>
      <PageHeader
        title={dict["financial.title"]}
        finding={
          <>
            {periodLabel} ·{" "}
            <span className="num">{formatMoney(snapshot.monthRevenueTotal)}</span>{" "}
            <span className="text-ink-faint">{currency}</span>{" "}
            {dict["financial.income"]} ·{" "}
            <span className="num">{formatMoney(snapshot.net)}</span>{" "}
            <span className="text-ink-faint">{currency}</span> {dict["financial.net"]}
          </>
        }
        actions={
          <>
            <Link
              href={`/api/buildings/${id}/financial-statement.pdf?year=${period.year}&month=${period.month}`}
              className="btn btn-secondary"
              prefetch={false}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} strokeWidth={1.7} aria-hidden="true" />
              {dict["financial.downloadPdf"]}
            </Link>
            <PrintButton label={dict["financial.print"]} />
          </>
        }
      />

      {isDemoMode() ? <DemoBanner message={dict["common.demoReadOnly"]} /> : null}

      <div className="no-print">
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
      </div>

      <div className="no-print">
        <MetricStrip
          items={[
            {
              label: dict["financial.income"],
              value: formatMoney(snapshot.monthRevenueTotal),
              unit: currency,
              hint: periodLabel,
            },
            {
              label: dict["financial.expenses"],
              value: formatMoney(snapshot.monthExpenseTotal),
              unit: currency,
              hint: periodLabel,
            },
            {
              label: dict["financial.net"],
              value: formatMoney(snapshot.net),
              unit: currency,
              answer: true,
              hint: dict["financial.formula"],
            },
            {
              label: dict["financial.ytdBalance"],
              value: formatMoney(yearRevenue - yearExpense),
              unit: currency,
              tone: yearRevenue - yearExpense < 0 ? "negative" : undefined,
              hint: `${dict["financial.ytdCollected"]} ${formatMoney(yearRevenue)} − ${dict["financial.ytdSpent"]} ${formatMoney(yearExpense)}`,
            },
          ]}
        />
      </div>

      <div className="no-print mt-4">
        <Panel
          title={dict["financial.monthly"]}
          hint={`${monthName(1, locale)} · ${monthName(period.month, locale)} ${period.year}`}
        >
          <ColumnChart
            labels={labels}
            height={200}
            highlightIndex={monthly.findIndex((point) => point.month === period.month)}
            series={[
              {
                key: "revenue",
                label: dict["financial.income"],
                values: monthly.map((point) => point.revenue),
              },
              {
                key: "expenses",
                label: dict["financial.expenses"],
                values: monthly.map((point) => point.expenses),
                tone: "muted",
              },
            ]}
          />
          <div className="mt-3 flex items-center gap-5 border-t border-divider pt-3 text-[12px] text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-accent" />
              {dict["financial.income"]}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-line-strong" />
              {dict["financial.expenses"]}
            </span>
            <span className="ms-auto text-ink-faint">{dict["financial.formula"]}</span>
          </div>
        </Panel>
      </div>

        <section className="print-sheet border border-line bg-surface p-8 overflow-x-auto md:overflow-visible">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{building.name}</h2>
            <p className="mt-1 text-[12px] text-ink-muted">
              {dict["financial.registration"]}: <span className="num">{building.registrationNo}</span>
              {" · "}
              {dict["financial.unified"]}: <span className="num">{building.unifiedId}</span>
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">{building.address}</p>
          </div>
          <div className="text-end text-[12px] text-ink-muted">
            <p>
              {dict["financial.hijri"]}: <span className="num">{formatHijri(statementDate, locale)}</span>
            </p>
            <p>
              {dict["financial.gregorian"]}:{" "}
              <span className="num">{formatShortDate(statementDate, locale)}</span>
            </p>
            <p className="mt-0.5">
              {dict["financial.iban"]}: <span className="num">{building.iban}</span>
            </p>
          </div>
        </header>

        <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.01em]">
          {locale === "ar"
            ? `التقرير المالي لشهر ${monthName(period.month, "ar")} ( ${period.month} ) للعام ${period.year} م`
            : `Financial statement for ${monthName(period.month, "en")} (${period.month}) ${period.year}`}
        </h3>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th className="num w-12">{dict["expenses.item"]}</th>
              <th>{dict["common.category"]}</th>
              <th>{dict["common.notes"]}</th>
              <th className="num">{dict["common.amount"]}</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.monthExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="num text-ink-faint">{expense.itemNo}</td>
                <td>{expense.category}</td>
                <td className="max-w-[320px] truncate text-ink-muted">{expense.notes}</td>
                <td className="num">
                  <Money value={expense.amount} unit={currencyUnit(locale)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="data-table mt-3 max-w-[520px]">
          <thead>
            <tr>
              <th>{dict["financial.balanceTable"]}</th>
              <th className="num">{dict["common.amount"]}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{dict["financial.income"]}</td>
              <td className="num">{formatMoney(snapshot.monthRevenueTotal)}</td>
            </tr>
            <tr>
              <td>{dict["financial.expenses"]}</td>
              <td className="num">{formatMoney(snapshot.monthExpenseTotal)}</td>
            </tr>
            <tr>
              <td className="font-semibold">{dict["financial.net"]}</td>
              <td className="num font-semibold">{formatMoney(snapshot.net)}</td>
            </tr>
          </tbody>
        </table>

        <footer className="mt-6 flex flex-wrap items-end justify-between gap-8 border-t border-line pt-6">
          <div className="text-[12px] text-ink-muted">
            <p className="font-medium text-ink">{building.chairmanName}</p>
            <p className="mt-0.5">{dict["financial.chairman"]}</p>
            <p className="mt-3">{building.address}</p>
          </div>
          <div className="text-center">
            {building.stampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transformedUrl(building.stampUrl, 220, 220)}
                alt={dict["financial.stamp"]}
                className="h-[92px] w-[92px] object-contain"
              />
            ) : (
              <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[12px] border border-dashed border-line-strong text-[11px] text-ink-faint">
                {dict["financial.stamp"]}
              </div>
            )}
            <p className="mt-2 text-[11px] text-ink-faint">{dict["voucher.receiptSeal"]}</p>
          </div>
        </footer>
      </section>

      <Panel title={dict["revenues.title"]} hint={periodLabel} className="no-print mt-4">
        <div className="-mx-5 max-h-[320px] overflow-auto">
            <table className="data-table min-w-[520px]">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr>
                  <th>{dict["common.voucher"]}</th>
                  <th>{dict["common.date"]}</th>
                  <th>{dict["common.unit"]}</th>
                  <th className="num">{dict["common.amount"]}</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((voucher) => {
                  const unit = voucher.unitId ? unitById.get(voucher.unitId) : undefined;
                  return (
                    <tr key={voucher.id}>
                      <td className="num">{voucher.voucherNo}</td>
                      <td className="num text-ink-muted">
                        {formatDayMonth(voucher.date, locale)}
                      </td>
                      <td>{unit ? unit.unitNumber : "·"}</td>
                      <td className="num">{formatMoney(voucher.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

      <div className="no-print mt-4">
        <Panel title={dict["common.email"]} hint={dict["financial.email"]}>
          <EmailSendForm
            endpoint={`/api/buildings/${id}/financial-statement/email`}
            body={{ year: period.year, month: period.month }}
            labels={{
              email: dict["financial.email"],
              send: dict["common.email"],
              sending: dict["common.saving"],
              placeholder: "manager@wafaatower.sa",
              sent: dict["common.saved"],
              failed: dict["common.error"],
            }}
          />
        </Panel>
      </div>
    </>
  );
}
