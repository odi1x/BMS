import { NextResponse } from "next/server";
import { requireBuildingAccess } from "@/lib/auth";
import { emailConfigured, sendEmail } from "@/lib/email";
import { formatMonthYear } from "@/lib/format";
import { getLocale } from "@/lib/preferences";
import { signPublicLink } from "@/lib/public-link";
import { loadBuildingSnapshot } from "@/lib/queries";
import { statementEmailHtml } from "@/lib/templates/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireBuildingAccess(id);

  const body = (await request.json().catch(() => null)) as { to?: string; year?: number; month?: number } | null;
  const to = body?.to?.trim() ?? "";

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const year = Number(body?.year ?? 2026);
  const month = Number(body?.month ?? 8);

  const snapshot = await loadBuildingSnapshot(session, id, year, month);
  if (!snapshot) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const locale = await getLocale();
  const origin = new URL(request.url).origin;
  const token = await signPublicLink({ buildingId: id, scope: "statement", year, month });

  const html = statementEmailHtml({
    building: snapshot.building,
    monthLabel: formatMonthYear(month, year, locale),
    year,
    revenue: snapshot.monthRevenueTotal,
    expensesTotal: snapshot.monthExpenseTotal,
    net: snapshot.net,
    expenseRows: snapshot.monthExpenses.map((expense) => ({
      itemNo: expense.itemNo,
      category: expense.category,
      notes: expense.notes,
      amount: expense.amount,
    })),
    statementUrl: `${origin}/api/buildings/${id}/financial-statement.pdf?year=${year}&month=${month}&token=${encodeURIComponent(token)}`,
  });

  const result = await sendEmail({
    to,
    subject: `${snapshot.building.name} · التقرير المالي ${formatMonthYear(month, year, locale)}`,
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
