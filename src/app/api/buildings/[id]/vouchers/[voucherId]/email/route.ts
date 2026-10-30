import { NextResponse } from "next/server";
import { amountInArabicWords } from "@/lib/arabic-numbers";
import { requireBuildingAccess } from "@/lib/auth";
import { emailConfigured, sendEmail } from "@/lib/email";
import { signPublicLink } from "@/lib/public-link";
import { tenantStore } from "@/lib/store";
import { voucherEmailHtml } from "@/lib/templates/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; voucherId: string }> },
) {
  const { id, voucherId } = await params;
  const user = await requireBuildingAccess(id);

  const body = (await request.json().catch(() => null)) as { to?: string } | null;
  const to = body?.to?.trim() ?? "";

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const data = tenantStore(user);
  const [voucher, building, units] = await Promise.all([
    data.getRevenue(id, voucherId),
    data.getBuilding(id),
    data.listUnits(id),
  ]);

  if (!voucher || !building) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const unit = voucher.unitId ? units.find((row) => row.id === voucher.unitId) : undefined;
  const payer = unit?.ownerName ?? unit?.tenantName ?? "·";

  const origin = new URL(request.url).origin;
  const token = await signPublicLink({
    buildingId: id,
    scope: "voucher",
    voucherId,
    year: voucher.fiscalYear,
    month: voucher.fiscalMonth,
  });

  const html = voucherEmailHtml({
    building,
    voucherNo: voucher.voucherNo,
    payer,
    unitNumber: unit?.unitNumber ?? null,
    amount: voucher.amount,
    amountWords: amountInArabicWords(voucher.amount),
    purpose: voucher.notes,
    voucherUrl: `${origin}/api/buildings/${id}/vouchers/${voucherId}.pdf?token=${encodeURIComponent(token)}`,
  });

  const result = await sendEmail({
    to,
    subject: `${building.name} · سند قبض رقم ${voucher.voucherNo}`,
    html,
  });

  if (!result.sent) {
    return NextResponse.json(
      { error: result.reason ?? "EMAIL_FAILED" },
      { status: result.reason === "EMAIL_NOT_CONFIGURED" ? 503 : 502 },
    );
  }

  return NextResponse.json({ sent: true });
}

export async function GET() {
  return NextResponse.json({ configured: emailConfigured() });
}
