import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Download, Pencil, Plus, Printer } from "lucide-react";
import { VoucherForm } from "@/components/revenues/VoucherForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { Money, StatusPill } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { requireUser } from "@/lib/auth";
import { currencyUnit, formatDayMonth, formatMoney, formatMonthYear } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import { periodEndDate, resolvePeriod } from "@/lib/period";
import { loadBuildingSnapshot } from "@/lib/queries";
import { isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "الإيرادات والسداد" };

export default async function RevenuesPage({
  params,
  searchParams,
}: PageProps<"/buildings/[id]/revenues">) {
  const { id } = await params;
  const query = await searchParams;
  const period = resolvePeriod(query);
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id, period.year, period.month);
  if (!snapshot) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);
  const currency = currencyUnit(locale);
  const showForm = query.new === "1";
  const editId = typeof query.edit === "string" ? query.edit : "";
  const periodLabel = formatMonthYear(period.month, period.year, locale);

  const revenues = [...snapshot.monthRevenues].sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
    return Number(a.voucherNo) - Number(b.voucherNo);
  });

  const unitById = new Map(snapshot.units.map((unit) => [unit.id, unit]));
  const summary = snapshot.settlementSummary;
  const nextVoucher =
    revenues.reduce((max, row) => Math.max(max, Number(row.voucherNo) || 0), 0) + 1;

  const averageVoucher =
    revenues.length > 0 ? snapshot.monthRevenueTotal / revenues.length : 0;

  const editingVoucher = editId
    ? snapshot.monthRevenues.find((row) => row.id === editId) ?? null
    : null;

  const voucherFormLabels = {
    fiscalYear: dict["common.fiscalYear"],
    month: dict["common.month"],
    voucher: dict["common.voucher"],
    date: dict["common.date"],
    unit: dict["common.unit"],
    amount: dict["common.amount"],
    channel: dict["common.channel"],
    cash: dict["revenues.channelCash"],
    bank: dict["revenues.channelBank"],
    other: dict["revenues.channelOther"],
    notes: dict["common.notes"],
    save: dict["common.save"],
    saving: dict["common.saving"],
    saved: dict["common.saved"],
    required: dict["auth.required"],
    duplicate: dict["revenues.voucherDuplicate"],
  };

  const unsettled = summary.unpaid + summary.partial;

  return (
    <>
      <PageHeader
        title={dict["revenues.title"]}
        finding={
          <>
            {periodLabel} ·{" "}
            <span className="num">{formatMoney(snapshot.monthRevenueTotal)}</span>{" "}
            <span className="text-ink-faint">{currency}</span> ·{" "}
            <span className="num">{revenues.length}</span> {dict["revenues.voucherCount"]}
            {unsettled > 0 ? (
              <>
                {" · "}
                <span className="num">{unsettled}</span> {dict["dashboard.unpaidUnits"]}
              </>
            ) : null}
          </>
        }
        actions={
          <Link
            href={
              showForm
                ? `/buildings/${id}/revenues?year=${period.year}&month=${period.month}`
                : `/buildings/${id}/revenues?new=1&year=${period.year}&month=${period.month}`
            }
            className="btn btn-primary"
          >
            <Plus size={16} strokeWidth={1.7} aria-hidden="true" />
            {dict["revenues.newVoucher"]}
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
            label: dict["revenues.totalIncome"],
            value: formatMoney(snapshot.monthRevenueTotal),
            unit: currency,
            answer: true,
            hint: periodLabel,
          },
          {
            label: dict["revenues.voucherCount"],
            value: String(revenues.length),
            hint: `${formatMoney(averageVoucher)} ${currency} ${dict["revenues.average"]}`,
          },
          {
            label: dict["common.outstanding"],
            value: formatMoney(summary.outstanding),
            unit: currency,
            hint: `${unsettled} ${dict["dashboard.unpaidUnits"]}`,
          },
          {
            label: dict["dashboard.collectionRate"],
            value: `${summary.collectionRate}%`,
            hint: `${summary.paid} ${dict["building.unitsPaid"]} ${dict["common.of"]} ${summary.units}`,
          },
        ]}
      />

      {showForm ? (
        <div className="mt-6">
          <Panel title={dict["revenues.newVoucher"]} hint={periodLabel}>
            <VoucherForm
              buildingId={id}
              voucherNo={String(nextVoucher)}
              fiscalYear={period.year}
              fiscalMonth={period.month}
              defaultDate={periodEndDate(period)}
              units={snapshot.units.map((unit) => ({
                id: unit.id,
                unitNumber: unit.unitNumber,
                ownerName: unit.ownerName,
              }))}
              labels={voucherFormLabels}
            />
          </Panel>
        </div>
      ) : null}

      {editingVoucher ? (
        <div className="mt-6">
          <Panel
            title={`${dict["revenues.editTitle"]} · ${editingVoucher.voucherNo}`}
            hint={periodLabel}
            action={
              <Link
                href={`/buildings/${id}/revenues?year=${period.year}&month=${period.month}`}
                className="btn btn-ghost btn-sm"
              >
                {dict["common.cancel"]}
              </Link>
            }
          >
            <VoucherForm
              buildingId={id}
              voucherNo={String(nextVoucher)}
              fiscalYear={period.year}
              fiscalMonth={period.month}
              defaultDate={periodEndDate(period)}
              voucher={{
                id: editingVoucher.id,
                voucherNo: editingVoucher.voucherNo,
                date: editingVoucher.date.toISOString().slice(0, 10),
                unitId: editingVoucher.unitId ?? "",
                amount: String(editingVoucher.amount),
                paymentChannel: editingVoucher.paymentChannel,
                notes: editingVoucher.notes ?? "",
              }}
              units={snapshot.units.map((unit) => ({
                id: unit.id,
                unitNumber: unit.unitNumber,
                ownerName: unit.ownerName,
              }))}
              labels={voucherFormLabels}
            />
          </Panel>
        </div>
      ) : null}

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title={dict["revenues.title"]}
          hint={periodLabel}
          className="min-w-0"
        >
          <div className="-mx-5 max-h-[380px] overflow-auto">
            <table className="data-table min-w-[760px]">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr>
                  <th>{dict["common.voucher"]}</th>
                  <th>{dict["common.date"]}</th>
                  <th>{dict["common.unit"]}</th>
                  <th>{dict["common.channel"]}</th>
                  <th className="num">{dict["common.amount"]}</th>
                  <th aria-label={dict["common.actions"]} />
                </tr>
              </thead>
              <tbody>
                {revenues.map((voucher) => {
                  const unit = voucher.unitId ? unitById.get(voucher.unitId) : undefined;
                  return (
                    <tr key={voucher.id}>
                      <td className="num font-medium">{voucher.voucherNo}</td>
                      <td className="num text-ink-muted">{formatDayMonth(voucher.date, locale)}</td>
                      <td>
                        {unit ? (
                          <span className="flex flex-col">
                            <span>
                              {dict["units.unitNumber"]} {unit.unitNumber}
                            </span>
                            <span className="text-[13px] text-ink-faint">{unit.ownerName}</span>
                          </span>
                        ) : (
                          <span className="text-ink-faint">·</span>
                        )}
                      </td>
                      <td className="text-ink-muted">
                        {voucher.paymentChannel === "CASH"
                          ? dict["revenues.channelCash"]
                          : voucher.paymentChannel === "BANK_TRANSFER"
                            ? dict["revenues.channelBank"]
                            : dict["revenues.channelOther"]}
                      </td>
                      <td className="num">
                        <Money value={voucher.amount} unit={currency} />
                      </td>
                      <td>
                        <span className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/api/buildings/${id}/vouchers/${voucher.id}.pdf`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`${dict["revenues.downloadPdf"]} · ${voucher.voucherNo}`}
                            title={dict["revenues.downloadPdf"]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={15} strokeWidth={1.6} aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/buildings/${id}/vouchers/${voucher.id}`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`${dict["revenues.printVoucher"]} · ${voucher.voucherNo}`}
                            title={dict["revenues.printVoucher"]}
                          >
                            <Printer size={15} strokeWidth={1.6} aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/buildings/${id}/revenues?edit=${voucher.id}&year=${period.year}&month=${period.month}`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`${dict["revenues.edit"]} · ${voucher.voucherNo}`}
                            title={dict["revenues.edit"]}
                          >
                            <Pencil size={15} strokeWidth={1.6} aria-hidden="true" />
                          </Link>
                          <DeleteButton
                            kind="revenue"
                            id={voucher.id}
                            buildingId={id}
                            label={`${dict["common.delete"]} · ${voucher.voucherNo}`}
                            confirmLabel={dict["common.confirmDelete"]}
                            cancelLabel={dict["common.cancel"]}
                            confirmMessage={dict["revenues.deleteConfirm"]}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {revenues.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-ink-muted">{dict["common.empty"]}</p>
          ) : null}
        </Panel>

        <Panel
          title={dict["building.collection"]}
          hint={dict["revenues.auditHint"]}
          action={
            <Link href={`/buildings/${id}#settlement`} className="btn btn-ghost btn-sm">
              {dict["dashboard.towerOpen"]}
            </Link>
          }
        >
          <h3 className="text-[13px] font-semibold">{dict["dashboard.collectionRate"]}</h3>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <p className="num text-[30px] leading-none font-medium tracking-[-0.03em]">
              {summary.collectionRate}
              <span className="ms-1 text-[16px] text-ink-faint">%</span>
            </p>
            <p className="num text-[13px] text-ink-muted">
              {formatMoney(summary.collected)} / {formatMoney(summary.required)}
            </p>
          </div>
          <div className="track mt-3">
            <div className="track-fill" style={{ width: `${summary.collectionRate}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
            <StatusPill tone="positive">
              {summary.paid} {dict["building.unitsPaid"]}
            </StatusPill>
            {summary.partial > 0 ? (
              <StatusPill tone="neutral">
                {summary.partial} {dict["building.unitsPartial"]}
              </StatusPill>
            ) : null}
            {summary.unpaid > 0 ? (
              <StatusPill tone="negative">
                {summary.unpaid} {dict["building.unitsUnpaid"]}
              </StatusPill>
            ) : null}
          </div>
          <p className="mt-3 text-[13px] text-ink-muted">
            <span className="num">{formatMoney(summary.outstanding)}</span>{" "}
            <span className="text-ink-faint">{currency}</span> {dict["common.outstanding"]}
          </p>

          <div className="mt-5 border-t border-divider pt-4">
            <h3 className="text-[13px] font-semibold">{dict["revenues.byChannel"]}</h3>
            <dl className="mt-2 flex flex-col">
              {snapshot.channels.map((channel) => (
                <div
                  key={channel.channel}
                  className="flex items-center justify-between gap-3 border-b border-divider py-2.5 last:border-b-0"
                >
                  <dt className="text-[13px] text-ink">
                    {channel.channel === "CASH"
                      ? dict["revenues.channelCash"]
                      : channel.channel === "BANK_TRANSFER"
                        ? dict["revenues.channelBank"]
                        : dict["revenues.channelOther"]}
                  </dt>
                  <dd className="num text-[13px] text-ink">
                    {formatMoney(channel.amount)}
                    <span className="ms-1 text-[11px] text-ink-faint">{currency}</span>
                    <span className="ms-2 text-[12px] text-ink-faint">
                      {channel.count} · {channel.share}%
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          id="audit"
          title={dict["revenues.audit"]}
          hint={dict["revenues.auditHint"]}
          action={
            <StatusPill tone={summary.outstanding > 0 ? "negative" : "positive"}>
              {summary.outstanding > 0
                ? `${formatMoney(summary.outstanding)} ${currency} ${dict["revenues.outstandingLabel"]}`
                : dict["revenues.noOutstanding"]}
            </StatusPill>
          }
        >
          <div className="-mx-5 max-h-[520px] overflow-auto">
            <table className="data-table min-w-[640px]">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr>
                  <th>{dict["common.unit"]}</th>
                  <th>{dict["units.owner"]}</th>
                  <th className="num">{dict["common.required"]}</th>
                  <th className="num">{dict["common.collected"]}</th>
                  <th className="num">{dict["common.outstanding"]}</th>
                  <th>{dict["common.status"]}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.settlement.map((row) => (
                  <tr key={row.unitId}>
                    <td>
                      <span className="font-medium">
                        {dict["units.unitNumber"]} {row.unitNumber}
                      </span>
                      <span className="ms-2 text-[13px] text-ink-faint">{row.floor}</span>
                    </td>
                    <td className="text-ink-muted">{row.ownerName}</td>
                    <td className="num">{formatMoney(row.required)}</td>
                    <td className="num">{formatMoney(row.collected)}</td>
                    <td className="num">
                      {row.outstanding > 0 ? (
                        <span style={{ color: "var(--negative-ink)" }}>
                          {formatMoney(row.outstanding)}
                        </span>
                      ) : (
                        <span className="text-ink-faint">·</span>
                      )}
                    </td>
                    <td>
                      {row.status === "PAID" ? (
                        <StatusPill tone="positive">{dict["units.statusPaid"]}</StatusPill>
                      ) : row.status === "PARTIAL" ? (
                        <StatusPill tone="neutral">{dict["units.statusPartial"]}</StatusPill>
                      ) : (
                        <StatusPill tone="negative">{dict["units.statusUnpaid"]}</StatusPill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
