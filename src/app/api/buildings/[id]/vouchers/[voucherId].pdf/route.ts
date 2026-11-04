import { NextResponse } from "next/server";
import { amountInArabicWords } from "@/lib/arabic-numbers";
import { requireBuildingAccess } from "@/lib/auth";
import { formatHijri, formatShortDate } from "@/lib/format";
import { htmlToPdf } from "@/lib/pdf";
import { getLocale } from "@/lib/preferences";
import { verifyPublicLink } from "@/lib/public-link";
import { store, tenantStore } from "@/lib/store";
import { voucherHtml } from "@/lib/templates/document";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; voucherId: string }> },
) {
  const { id, voucherId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  let context: SessionUser | null = null;

  if (token) {
    const claims = await verifyPublicLink(token, "voucher");
    if (!claims || claims.buildingId !== id || claims.voucherId !== voucherId) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 403 });
    }
  } else {
    context = await requireBuildingAccess(id);
  }

  const data = context ? tenantStore(context) : store();
  const voucher = await data.getRevenue(id, voucherId);
  if (!voucher) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const units = await data.listUnits(id);
  const building = await data.getBuilding(id);
  if (!building) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const locale = await getLocale();
  const unit = voucher.unitId ? units.find((row) => row.id === voucher.unitId) : undefined;

  const html = voucherHtml({
    building,
    voucherNo: voucher.voucherNo,
    payer: unit?.ownerName ?? unit?.tenantName ?? "·",
    unitNumber: unit?.unitNumber ?? null,
    amount: voucher.amount,
    amountWords: amountInArabicWords(voucher.amount),
    purpose: voucher.notes,
    channel:
      voucher.paymentChannel === "CASH"
        ? "نقداً"
        : voucher.paymentChannel === "BANK_TRANSFER"
          ? "تحويل بنكي"
          : "أخرى / مواقف",
    hijriDate: formatHijri(voucher.date, locale),
    gregorianDate: formatShortDate(voucher.date, locale),
    fontBaseUrl: new URL(request.url).origin,
  });

  try {
    const pdf = await htmlToPdf(html);
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="voucher-${voucher.voucherNo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("[voucher.pdf]", cause);
    return NextResponse.json({ error: "PDF_FAILED" }, { status: 500 });
  }
}
