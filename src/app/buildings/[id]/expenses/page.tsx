import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FileText, Pencil, Plus, TriangleAlert } from "lucide-react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { BillForm } from "@/components/expenses/BillForm";
import { ContractForm } from "@/components/expenses/ContractForm";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { BarList } from "@/components/ui/BarList";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { Money, StatusPill } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { requireUser } from "@/lib/auth";
import { standardItemNo } from "@/lib/expense-categories";
import { formatDayMonth, formatMoney, formatMonthYear , currencyUnit } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import { periodEndDate, resolvePeriod } from "@/lib/period";
import { loadBuildingSnapshot } from "@/lib/queries";
import { isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "المصروفات والفوترة" };

export default async function ExpensesPage({
  params,
  searchParams,
}: PageProps<"/buildings/[id]/expenses">) {
  const { id } = await params;
  const query = await searchParams;
  const period = resolvePeriod(query);
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id, period.year, period.month);
  if (!snapshot) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);
  const currency = currencyUnit(locale);
  const periodLabel = formatMonthYear(period.month, period.year, locale);

  const showForm = query.new === "1";
  const showBillForm = query.bill === "1";
  const showContractForm = query.contract === "1";
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editBillId = typeof query.editBill === "string" ? query.editBill : "";
  const editContractId = typeof query.editContract === "string" ? query.editContract : "";

  const expenses = [...snapshot.monthExpenses].sort((a, b) => a.itemNo - b.itemNo);
  const bills = [...snapshot.monthBills].sort(
    (a, b) => a.paymentDate.getTime() - b.paymentDate.getTime(),
  );

  const payroll = expenses
    .filter((expense) => standardItemNo(expense.category) === 11)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const periodEnd = new Date(Date.UTC(period.year, period.month, 0));
  const contracts = snapshot.contracts.map((contract) => ({
    ...contract,
    overdue: contract.nextDueDate !== null && new Date(contract.nextDueDate) < periodEnd,
  }));

  const topCategories = snapshot.categories.slice(0, 6);
  const restCategories = snapshot.categories.length - topCategories.length;
  const hiddenAmount =
    snapshot.monthExpenseTotal -
    topCategories.reduce((sum, category) => sum + category.amount, 0);

  const editingExpense = editId
    ? snapshot.monthExpenses.find((expense) => expense.id === editId) ?? null
    : null;
  const editingBill = editBillId
    ? snapshot.monthBills.find((bill) => bill.id === editBillId) ?? null
    : null;
  const editingContract = editContractId
    ? snapshot.contracts.find((contract) => contract.id === editContractId) ?? null
    : null;

  const contractHint = contracts.some((contract) => contract.overdue)
    ? dict["expenses.finding"]
    : dict["expenses.noOverdue"];

  const periodQuery = `year=${period.year}&month=${period.month}`;

  return (
    <>
      <PageHeader
        title={dict["expenses.title"]}
        finding={
          <>
            {periodLabel} ·{" "}
            <span className="num">{formatMoney(snapshot.monthExpenseTotal)}</span>{" "}
            <span className="text-ink-faint">{currency}</span> ·{" "}
            <span className="num">{expenses.length}</span> {dict["expenses.itemsCount"]}
            {contracts.some((contract) => contract.overdue) ? (
              <>
                {" · "}
                <span className="num">{contracts.filter((c) => c.overdue).length}</span>{" "}
                {dict["expenses.overdue"]}
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Link
              href={
                showBillForm
                  ? `/buildings/${id}/expenses?${periodQuery}`
                  : `/buildings/${id}/expenses?bill=1&${periodQuery}`
              }
              className="btn btn-secondary"
            >
              <FileText size={16} strokeWidth={1.7} aria-hidden="true" />
              {dict["expenses.newBill"]}
            </Link>
            <Link
              href={
                showForm
                  ? `/buildings/${id}/expenses?${periodQuery}`
                  : `/buildings/${id}/expenses?new=1&${periodQuery}`
              }
              className="btn btn-primary"
            >
              <Plus size={16} strokeWidth={1.7} aria-hidden="true" />
              {dict["common.add"]}
            </Link>
          </>
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
            label: dict["expenses.expensesTotal"],
            value: formatMoney(snapshot.monthExpenseTotal),
            unit: currency,
            answer: true,
            hint: `${expenses.length} ${dict["expenses.itemsCount"]}`,
          },
          {
            label: dict["expenses.utilitiesTotal"],
            value: formatMoney(snapshot.monthBillTotal),
            unit: currency,
            hint: `${bills.length} ${dict["expenses.billCount"]}`,
          },
          {
            label: dict["expenses.powerSubtotal"],
            value: formatMoney(snapshot.monthPowerTotal),
            unit: currency,
            hint: dict["expenses.powerMeters"],
          },
          {
            label: dict["expenses.contractsCount"],
            value: String(contracts.length),
            hint: contracts.some((contract) => contract.overdue)
              ? `${contracts.filter((contract) => contract.overdue).length} ${dict["expenses.overdue"]}`
              : dict["expenses.noOverdue"],
          },
        ]}
      />

      {showForm ? (
        <div className="mb-4">
          <Panel title={dict["common.add"]} hint={periodLabel}>
            <ExpenseForm
              buildingId={id}
              fiscalYear={period.year}
              fiscalMonth={period.month}
              labels={{
                item: dict["expenses.itemNo"],
                category: dict["expenses.categorySelect"],
                amount: dict["common.amount"],
                notes: dict["common.notes"],
                save: dict["common.save"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      {editingExpense ? (
        <div className="mb-4">
          <Panel
            title={`${dict["common.edit"]} · ${editingExpense.category}`}
            hint={periodLabel}
            action={
              <Link href={`/buildings/${id}/expenses?${periodQuery}`} className="btn btn-ghost btn-sm">
                {dict["common.cancel"]}
              </Link>
            }
          >
            <ExpenseForm
              buildingId={id}
              fiscalYear={period.year}
              fiscalMonth={period.month}
              expense={{
                id: editingExpense.id,
                itemNo: editingExpense.itemNo,
                category: editingExpense.category,
                amount: String(editingExpense.amount),
                notes: editingExpense.notes ?? "",
              }}
              labels={{
                item: dict["expenses.itemNo"],
                category: dict["expenses.categorySelect"],
                amount: dict["common.amount"],
                notes: dict["common.notes"],
                save: dict["common.save"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      {showBillForm ? (
        <div className="mb-4">
          <Panel title={dict["expenses.newBillTitle"]} hint={periodLabel}>
            <BillForm
              buildingId={id}
              fiscalYear={period.year}
              fiscalMonth={period.month}
              defaultDate={periodEndDate(period)}
              labels={{
                type: dict["expenses.type"],
                accountNo: dict["expenses.accountNo"],
                meterNo: dict["expenses.meterNo"],
                amount: dict["common.amount"],
                date: dict["common.date"],
                save: dict["common.save"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      {editingBill ? (
        <div className="mb-4">
          <Panel
            title={`${dict["common.edit"]} · ${editingBill.type}`}
            hint={periodLabel}
            action={
              <Link href={`/buildings/${id}/expenses?${periodQuery}`} className="btn btn-ghost btn-sm">
                {dict["common.cancel"]}
              </Link>
            }
          >
            <BillForm
              buildingId={id}
              fiscalYear={period.year}
              fiscalMonth={period.month}
              defaultDate={periodEndDate(period)}
              bill={{
                id: editingBill.id,
                type: editingBill.type,
                accountNo: editingBill.accountNo,
                meterNo: editingBill.meterNo ?? "",
                amount: String(editingBill.amount),
                paymentDate: editingBill.paymentDate.toISOString().slice(0, 10),
              }}
              labels={{
                type: dict["expenses.type"],
                accountNo: dict["expenses.accountNo"],
                meterNo: dict["expenses.meterNo"],
                amount: dict["common.amount"],
                date: dict["common.date"],
                save: dict["common.save"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      {showContractForm ? (
        <div className="mb-4">
          <Panel title={dict["expenses.newContract"]} hint={dict["expenses.contractTitle"]}>
            <ContractForm
              buildingId={id}
              labels={{
                title: dict["common.category"],
                vendor: dict["expenses.vendor"],
                totalAmount: dict["expenses.contractTotal"],
                itemCount: dict["expenses.itemCount"],
                startDate: dict["expenses.startDate"],
                endDate: dict["expenses.endDate"],
                nextDueDate: dict["expenses.nextDue"],
                paidAmount: dict["expenses.paid"],
                installment: dict["expenses.installment"],
                balanceDue: dict["expenses.balance"],
                paymentNote: dict["common.notes"],
                save: dict["common.save"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      {editingContract ? (
        <div className="mb-4">
          <Panel
            title={`${dict["expenses.editContract"]} · ${editingContract.title}`}
            hint={dict["expenses.contractTitle"]}
            action={
              <Link href={`/buildings/${id}/expenses?${periodQuery}`} className="btn btn-ghost btn-sm">
                {dict["common.cancel"]}
              </Link>
            }
          >
            <ContractForm
              buildingId={id}
              contract={{
                id: editingContract.id,
                title: editingContract.title,
                vendor: editingContract.vendor ?? "",
                totalAmount: String(editingContract.totalAmount),
                itemCount: editingContract.itemCount === null ? "" : String(editingContract.itemCount),
                startDate: editingContract.startDate.toISOString().slice(0, 10),
                endDate: editingContract.endDate.toISOString().slice(0, 10),
                nextDueDate: editingContract.nextDueDate
                  ? editingContract.nextDueDate.toISOString().slice(0, 10)
                  : "",
                paidAmount: String(editingContract.paidAmount),
                installment:
                  editingContract.installment === null ? "" : String(editingContract.installment),
                balanceDue:
                  editingContract.balanceDue === null ? "" : String(editingContract.balanceDue),
                paymentNote: editingContract.paymentNote ?? "",
              }}
              labels={{
                title: dict["common.category"],
                vendor: dict["expenses.vendor"],
                totalAmount: dict["expenses.contractTotal"],
                itemCount: dict["expenses.itemCount"],
                startDate: dict["expenses.startDate"],
                endDate: dict["expenses.endDate"],
                nextDueDate: dict["expenses.nextDue"],
                paidAmount: dict["expenses.paid"],
                installment: dict["expenses.installment"],
                balanceDue: dict["expenses.balance"],
                paymentNote: dict["common.notes"],
                save: dict["common.save"],
                saving: dict["common.saving"],
                saved: dict["common.saved"],
                required: dict["auth.required"],
              }}
            />
          </Panel>
        </div>
      ) : null}

      <Panel
        title={dict["expenses.servicesAndSpend"]}
        hint={periodLabel}
        className="min-w-0"
        action={
          <Link
            href={`/buildings/${id}/expenses?bill=1&${periodQuery}`}
            className="btn btn-ghost btn-sm"
          >
            {dict["common.add"]}
          </Link>
        }
      >
        <div className="grid gap-x-6 gap-y-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <section className="min-w-0">
            <h3 className="text-[13px] font-semibold">{dict["expenses.utilities"]}</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="data-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>{dict["expenses.type"]}</th>
                    <th>{dict["expenses.accountNo"]}</th>
                    <th>{dict["common.date"]}</th>
                    <th className="num">{dict["common.amount"]}</th>
                    <th aria-label={dict["common.actions"]} />
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td>
                        <span className="flex flex-col">
                          <span>{bill.type}</span>
                          {bill.meterNo ? (
                            <span className="num text-[13px] text-ink-faint" dir="ltr">
                              {bill.meterNo}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="num text-ink-muted" dir="ltr">
                        {bill.accountNo}
                      </td>
                      <td className="num text-ink-muted">
                        {formatDayMonth(bill.paymentDate, locale)}
                      </td>
                      <td className="num">
                        <Money value={bill.amount} unit={currency} />
                      </td>
                      <td>
                        <span className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/buildings/${id}/expenses?editBill=${bill.id}&${periodQuery}`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`${dict["common.edit"]} · ${bill.type}`}
                            title={dict["common.edit"]}
                          >
                            <Pencil size={15} strokeWidth={1.6} aria-hidden="true" />
                          </Link>
                          <DeleteButton
                            kind="bill"
                            id={bill.id}
                            buildingId={id}
                            label={`${dict["common.delete"]} · ${bill.type}`}
                            confirmLabel={dict["common.confirmDelete"]}
                            cancelLabel={dict["common.cancel"]}
                            confirmMessage={dict["expenses.deleteConfirm"]}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 flex flex-col gap-2 border-t border-divider pt-4 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">{dict["expenses.powerSubtotal"]}</dt>
                <dd className="num">{formatMoney(snapshot.monthPowerTotal)} {currency}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">{dict["expenses.utilitiesTotal"]}</dt>
                <dd className="num font-medium">{formatMoney(snapshot.monthBillTotal)} {currency}</dd>
              </div>
            </dl>
          </section>

          <section className="min-w-0 xl:border-s xl:border-divider xl:ps-6">
            <h3 className="text-[13px] font-semibold">{dict["expenses.monthlyTrend"]}</h3>
            <ColumnChart
              labels={snapshot.monthly.map((point) => point.label)}
              height={280}
              highlightIndex={snapshot.monthly.findIndex((point) => point.month === period.month)}
              series={[
                {
                  key: "expenses",
                  label: dict["dashboard.towerExpenses"],
                  values: snapshot.monthly.map((point) => point.expenses),
                  tone: "muted",
                },
              ]}
            />
            <p className="mt-3 border-t border-divider pt-3 text-[13px] text-ink-muted">
              {dict["expenses.trendNote"]}
            </p>
          </section>
        </div>
      </Panel>

      <div className="mt-4">
        <Panel
          title={dict["expenses.general"]}
          hint={periodLabel}
          action={
            <Link href={`/buildings/${id}/expenses?new=1&${periodQuery}`} className="btn btn-ghost btn-sm">
              {dict["common.add"]}
            </Link>
          }
        >
          <div className="-mx-5 overflow-x-auto">
            <table className="data-table min-w-[660px]">
              <thead>
                <tr>
                  <th className="num w-10">{dict["expenses.item"]}</th>
                  <th>{dict["common.category"]}</th>
                  <th>{dict["common.notes"]}</th>
                  <th className="num">{dict["common.amount"]}</th>
                  <th aria-label={dict["common.actions"]} />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="num text-ink-faint">{expense.itemNo}</td>
                    <td>{expense.category}</td>
                    <td className="max-w-[240px] truncate text-ink-muted">{expense.notes}</td>
                    <td className="num">
                      {expense.amount > 0 ? (
                        <Money value={expense.amount} unit={currencyUnit(locale)} />
                      ) : (
                        <span className="text-ink-faint">0.00</span>
                      )}
                    </td>
                    <td>
                      <span className="flex items-center justify-end gap-0.5">
                        <Link
                          href={`/buildings/${id}/expenses?edit=${expense.id}&${periodQuery}`}
                          className="btn btn-ghost btn-sm"
                          aria-label={`${dict["common.edit"]} · ${expense.category}`}
                          title={dict["common.edit"]}
                        >
                          <Pencil size={15} strokeWidth={1.6} aria-hidden="true" />
                        </Link>
                        <DeleteButton
                          kind="expense"
                          id={expense.id}
                          buildingId={id}
                          label={`${dict["common.delete"]} · ${expense.category}`}
                          confirmLabel={dict["common.confirmDelete"]}
                          cancelLabel={dict["common.cancel"]}
                          confirmMessage={dict["expenses.deleteConfirm"]}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td />
                  <td className="font-semibold">{dict["expenses.expensesTotal"]}</td>
                  <td />
                  <td className="num font-semibold">
                    <Money value={snapshot.monthExpenseTotal} unit={currencyUnit(locale)} />
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title={dict["expenses.contracts"]}
          hint={contractHint}
          action={
            <Link
              href={`/buildings/${id}/expenses?contract=1&${periodQuery}`}
              className="btn btn-ghost btn-sm"
            >
              {dict["expenses.newContract"]}
            </Link>
          }
        >
          <ul className="flex flex-col">
            {contracts.map((contract) => (
              <li key={contract.id} className="border-b border-divider py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{contract.title}</p>
                    <p className="mt-0.5 text-[13px] text-ink-faint">{contract.vendor}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {contract.overdue ? (
                      <StatusPill tone="negative">
                        <TriangleAlert size={12} strokeWidth={1.8} aria-hidden="true" />
                        {dict["expenses.overdue"]}
                      </StatusPill>
                    ) : null}
                    <Link
                      href={`/buildings/${id}/expenses?editContract=${contract.id}&${periodQuery}`}
                      className="btn btn-ghost btn-sm"
                      aria-label={`${dict["expenses.editContract"]} · ${contract.title}`}
                      title={dict["expenses.editContract"]}
                    >
                      <Pencil size={15} strokeWidth={1.6} aria-hidden="true" />
                    </Link>
                    <DeleteButton
                      kind="contract"
                      id={contract.id}
                      buildingId={id}
                      label={`${dict["common.delete"]} · ${contract.title}`}
                      confirmLabel={dict["common.confirmDelete"]}
                      cancelLabel={dict["common.cancel"]}
                      confirmMessage={dict["expenses.deleteConfirm"]}
                    />
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-4">
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.contractTotal"]}</dt>
                    <dd className="num mt-0.5">{formatMoney(contract.totalAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.paid"]}</dt>
                    <dd className="num mt-0.5">{formatMoney(contract.paidAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.balance"]}</dt>
                    <dd className="num mt-0.5" style={{ color: "var(--negative-ink)" }}>
                      {formatMoney(contract.balanceDue ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.installment"]}</dt>
                    <dd className="num mt-0.5">
                      {contract.installment === null ? "·" : formatMoney(contract.installment)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.startDate"]}</dt>
                    <dd className="num mt-0.5" dir="ltr">
                      {contract.startDate.toISOString().slice(0, 10)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.endDate"]}</dt>
                    <dd className="num mt-0.5" dir="ltr">
                      {contract.endDate.toISOString().slice(0, 10)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.itemCount"]}</dt>
                    <dd className="num mt-0.5">{contract.itemCount ?? "·"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">{dict["expenses.nextDue"]}</dt>
                    <dd className="num mt-0.5" dir="ltr">
                      {contract.nextDueDate
                        ? contract.nextDueDate.toISOString().slice(0, 10)
                        : "·"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{contract.paymentNote}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={dict["expenses.topCategories"]} hint={periodLabel}>
          <BarList
            unit={currencyUnit(locale)}
            rows={topCategories.map((category) => ({
              label: category.category,
              value: category.amount,
            }))}
          />
          <p className="mt-3 border-t border-divider pt-3 text-[13px] text-ink-faint">
            {dict["expenses.payroll"]} {formatMoney(payroll)} {currency} ·{" "}
            {dict["expenses.operatingSplit"]} {formatMoney(snapshot.monthExpenseTotal - payroll)} {currency}
            {restCategories > 0 ? (
              <>
                {" · "}
                {restCategories} {dict["expenses.otherItemsHidden"]} {formatMoney(hiddenAmount)} {currency}
              </>
            ) : null}
          </p>
        </Panel>
      </div>
    </>
  );
}
