import { NextResponse } from "next/server";
import { requireBuildingAccess } from "@/lib/auth";
import { formatHijri, formatShortDate, monthName } from "@/lib/format";
import { htmlToPdf } from "@/lib/pdf";
import { getLocale } from "@/lib/preferences";
import { verifyPublicLink } from "@/lib/public-link";
import { loadBuildingSnapshot, loadPublicBuildingSnapshot } from "@/lib/queries";
import { statementHtml } from "@/lib/templates/document";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  let year: number;
  let month: number;
  let context: SessionUser | null = null;

  if (token) {
    const claims = await verifyPublicLink(token, "statement");
    if (!claims || claims.buildingId !== id) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 403 });
    }
    if (typeof claims.year !== "number" || typeof claims.month !== "number") {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 403 });
    }
    year = claims.year;
    month = claims.month;
  } else {
    context = await requireBuildingAccess(id);
    year = Number(url.searchParams.get("year") ?? "2026");
    month = Number(url.searchParams.get("month") ?? "8");
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 2020 ||
    year > 2100 ||
    month < 1 ||
    month > 12
  ) {
    return NextResponse.json({ error: "INVALID_PERIOD" }, { status: 400 });
  }

  const snapshot = context
    ? await loadBuildingSnapshot(context, id, year, month)
    : await loadPublicBuildingSnapshot(id, year, month);
  if (!snapshot) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const locale = await getLocale();
  const statementDate = new Date(Date.UTC(year, month, 0));

  const html = statementHtml({
    building: snapshot.building,
    monthLabel: monthName(month, "ar"),
    month,
    year,
    hijriDate: formatHijri(statementDate, locale),
    gregorianDate: formatShortDate(statementDate, locale),
    expenses: snapshot.monthExpenses.map((expense) => ({
      itemNo: expense.itemNo,
      category: expense.category,
      notes: expense.notes,
      amount: expense.amount,
    })),
    revenue: snapshot.monthRevenueTotal,
    expensesTotal: snapshot.monthExpenseTotal,
    net: snapshot.net,
  });

  try {
    const pdf = await htmlToPdf(html);
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="statement-${year}-${month}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("[financial-statement.pdf]", cause);
    return NextResponse.json({ error: "PDF_FAILED" }, { status: 500 });
  }
}
