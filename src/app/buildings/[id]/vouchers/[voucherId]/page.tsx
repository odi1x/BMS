import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download } from "lucide-react";
import { EmailSendForm } from "@/components/financial/EmailSendForm";
import { PrintButton } from "@/components/ui/PrintButton";
import { requireUser } from "@/lib/auth";
import { amountInArabicWords } from "@/lib/arabic-numbers";
import { formatHijri, formatMoney, formatShortDate , currencyUnit } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { transformedUrl } from "@/lib/imagekit";
import { getLocale } from "@/lib/preferences";
import { tenantStore } from "@/lib/store";

export const metadata: Metadata = { title: "سند قبض" };

export default async function VoucherPage({
  params,
}: PageProps<"/buildings/[id]/vouchers/[voucherId]">) {
  const { id, voucherId } = await params;
  const user = await requireUser();
  const data = tenantStore(user);
  const [voucher, building, units] = await Promise.all([
    data.getRevenue(id, voucherId),
    data.getBuilding(id),
    data.listUnits(id),
  ]);

  if (!voucher || !building) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);

  const unit = voucher.unitId ? units.find((row) => row.id === voucher.unitId) : undefined;
  const payer = unit?.ownerName ?? unit?.tenantName ?? "·";

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/buildings/${id}/revenues`} className="btn btn-ghost">
          <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
          {dict["revenues.title"]}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/api/buildings/${id}/vouchers/${voucherId}.pdf`}
            className="btn btn-secondary"
            target="_blank"
            rel="noreferrer"
            prefetch={false}
          >
            <Download size={16} strokeWidth={1.7} aria-hidden="true" />
            {dict["common.pdf"]}
          </Link>
          <PrintButton label={dict["common.print"]} />
        </div>
      </div>

      <section className="print-sheet border border-line bg-surface p-8">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-5">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{building.name}</h1>
            <p className="mt-1 text-[12px] text-ink-muted">
              {dict["financial.registration"]}: <span className="num">{building.registrationNo ?? "·"}</span>
              {" · "}
              {dict["financial.unified"]}: <span className="num">{building.unifiedId ?? "·"}</span>
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">{building.address}</p>
          </div>
          <div className="text-center">
            {building.stampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transformedUrl(building.stampUrl, 220, 220)}
                alt={dict["voucher.receiptSeal"]}
                className="h-[86px] w-[86px] object-contain"
              />
            ) : (
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-[12px] border border-dashed border-line-strong text-[11px] text-ink-faint">
                {dict["voucher.receiptSeal"]}
              </div>
            )}
          </div>
        </header>

        <div className="mt-6 flex items-end justify-between gap-6">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{dict["voucher.title"]}</h2>
          <div className="text-[13px] text-ink-muted">
            <p>
              {dict["voucher.number"]}: <span className="num font-medium text-ink">{voucher.voucherNo}</span>
            </p>
            <p className="num mt-0.5" dir="ltr">
              {formatHijri(voucher.date, locale)} · {formatShortDate(voucher.date, locale)}
            </p>
          </div>
        </div>

        <dl className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-divider pb-3">
            <dt className="min-w-[130px] text-[13px] text-ink-faint">{dict["voucher.receivedFrom"]}</dt>
            <dd className="text-[16px] font-medium">
              {payer}
              {unit ? (
                <span className="ms-2 text-[13px] font-normal text-ink-muted">
                  · {dict["units.unitNumber"]} {unit.unitNumber}
                </span>
              ) : null}
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 border-b border-divider pb-3">
            <dt className="min-w-[130px] text-[13px] text-ink-faint">{dict["voucher.amountWords"]}</dt>
            <dd className="text-[16px] font-medium">{amountInArabicWords(voucher.amount)}</dd>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 border-b border-divider pb-3">
            <dt className="min-w-[130px] text-[13px] text-ink-faint">{dict["common.amount"]}</dt>
            <dd className="num text-[18px] font-semibold">{formatMoney(voucher.amount)} {currencyUnit(locale)}</dd>
            <dd className="text-[13px] text-ink-muted">
              {voucher.paymentChannel === "CASH"
                ? dict["revenues.channelCash"]
                : voucher.paymentChannel === "BANK_TRANSFER"
                  ? dict["revenues.channelBank"]
                  : dict["revenues.channelOther"]}
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 border-b border-divider pb-3">
            <dt className="min-w-[130px] text-[13px] text-ink-faint">{dict["voucher.purpose"]}</dt>
            <dd className="text-[15px]">
              {voucher.notes ?? "·"}
              {unit ? (
                <span className="ms-2 text-[13px] text-ink-muted">
                  {dict["units.annualFee"]} · {formatMoney(unit.annualFee)} {currencyUnit(locale)}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-10 border-t border-line pt-6">
          <div className="text-[12px] text-ink-muted">
            <div className="h-10 w-40 border-b border-line-strong" />
            <p className="mt-1.5">{dict["voucher.issuedBy"]}</p>
          </div>
          <div className="text-[12px] text-ink-muted">
            <div className="h-10 w-40 border-b border-line-strong" />
            <p className="mt-1.5">{dict["financial.signature"]}</p>
          </div>
          <div className="text-center">
            {building.stampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transformedUrl(building.stampUrl, 220, 220)}
                alt={dict["voucher.receiptSeal"]}
                className="h-[86px] w-[86px] object-contain"
              />
            ) : (
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-[12px] border border-dashed border-line-strong text-[11px] text-ink-faint">
                {dict["voucher.receiptSeal"]}
              </div>
            )}
            <p className="mt-2 text-[11px] text-ink-faint">{dict["voucher.receiptSeal"]}</p>
          </div>
        </footer>
      </section>

      <div className="no-print mt-4">
        <EmailSendForm
          endpoint={`/api/buildings/${id}/vouchers/${voucherId}/email`}
          body={{}}
          labels={{
            email: dict["voucher.title"],
            send: dict["common.email"],
            sending: dict["common.saving"],
            placeholder: "owner@wafaatower.sa",
            sent: dict["common.saved"],
            failed: dict["common.error"],
          }}
        />
      </div>
    </>
  );
}
