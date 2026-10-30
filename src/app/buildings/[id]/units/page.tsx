import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LayoutGrid, Pencil, Plus, Rows3 } from "lucide-react";
import { UnitCards } from "@/components/units/UnitCards";
import { UnitFilters } from "@/components/units/UnitFilters";
import { UnitForm } from "@/components/units/UnitForm";
import { UnitPhotoUpload } from "@/components/units/UnitPhotoUpload";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Money, StatusPill } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { requireUser } from "@/lib/auth";
import { formatMoney , currencyUnit } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { transformedUrl } from "@/lib/imagekit";
import { getLocale } from "@/lib/preferences";
import { resolvePeriod } from "@/lib/period";
import { loadBuildingSnapshot } from "@/lib/queries";
import { isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "الشقق" };

export default async function UnitsPage({
  params,
  searchParams,
}: PageProps<"/buildings/[id]/units">) {
  const { id } = await params;
  const query = await searchParams;
  const period = resolvePeriod(query);
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id, period.year, period.month);
  if (!snapshot) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);

  const search = typeof query.q === "string" ? query.q.trim() : "";
  const status = typeof query.status === "string" ? query.status : "";
  const floor = typeof query.floor === "string" ? query.floor : "";
  const view = query.view === "cards" ? "cards" : "table";
  const editId = typeof query.edit === "string" ? query.edit : "";
  const showForm = query.new === "1";

  const settlementByUnit = new Map(snapshot.settlement.map((row) => [row.unitId, row]));
  const floors = [...new Set(snapshot.units.map((unit) => unit.floor ?? "·"))];

  const rows = snapshot.units
    .map((unit) => ({ unit, settlement: settlementByUnit.get(unit.id) }))
    .filter((row) => row.settlement)
    .filter(({ unit, settlement }) => {
      if (status && settlement?.status !== status) return false;
      if (floor && (unit.floor ?? "·") !== floor) return false;
      if (search) {
        const haystack = `${unit.unitNumber} ${unit.ownerName ?? ""} ${unit.tenantName ?? ""} ${unit.floor ?? ""} ${unit.titleDeedNo ?? ""}`;
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

  const totals = rows.reduce(
    (accumulator, row) => ({
      required: accumulator.required + (row.settlement?.required ?? 0),
      collected: accumulator.collected + (row.settlement?.collected ?? 0),
      outstanding: accumulator.outstanding + (row.settlement?.outstanding ?? 0),
      unsettled:
        accumulator.unsettled +
        (row.settlement && row.settlement.status !== "PAID" ? 1 : 0),
    }),
    { required: 0, collected: 0, outstanding: 0, unsettled: 0 },
  );

  const unsettledCount = totals.unsettled;
  const currency = currencyUnit(locale);

  const editingUnit = editId
    ? snapshot.units.find((unit) => unit.id === editId) ?? null
    : null;

  const unitFormLabels = {
    unitNumber: dict["units.unitNumber"],
    floor: dict["common.floor"],
    titleDeed: dict["units.titleDeed"],
    hasParking: dict["units.hasParking"],
    parkingCard: dict["units.parkingCard"],
    electricityMeter: dict["units.electricityMeter"],
    waterMeter: dict["units.waterMeter"],
    owner: dict["units.owner"],
    ownerPhone: dict["units.ownerPhone"],
    tenant: dict["units.tenant"],
    tenantPhone: dict["units.tenantPhone"],
    rentalDeed: dict["units.rentalDeed"],
    area: dict["units.area"],
    annualFee: dict["units.annualFee"],
    additionalFees: dict["units.additionalFees"],
    save: dict["common.save"],
    saving: dict["common.saving"],
    saved: dict["common.saved"],
    required: dict["auth.required"],
    optional: dict["common.optional"],
  };

  const unitHref = (extra: string) => {
    const params = new URLSearchParams();
    params.set("year", String(period.year));
    params.set("month", String(period.month));
    params.set(extra.split("=")[0], extra.split("=")[1]);
    return `/buildings/${id}/units?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title={dict["units.title"]}
        finding={
          <>
            <span className="num">{rows.length}</span> {dict["units.results"]} ·{" "}
            <span className="num">{unsettledCount}</span> {dict["dashboard.unpaidUnits"]} ·{" "}
            <span className="num">{formatMoney(totals.outstanding)}</span>{" "}
            <span className="text-ink-faint">{currency}</span> {dict["common.outstanding"]}
          </>
        }
        actions={
          <>
            <div className="flex items-center gap-1 rounded-[10px] border border-line bg-surface p-0.5">
              <Link
                href={unitHref(`view=${view === "table" ? "cards" : "table"}`)}
                className={`btn btn-sm ${view === "table" ? "btn-primary" : "btn-ghost"}`}
                aria-pressed={view === "table"}
                title={dict["units.viewTable"]}
              >
                <Rows3 size={15} strokeWidth={1.7} aria-hidden="true" />
                {dict["units.viewTable"]}
              </Link>
              <Link
                href={unitHref(`view=${view === "cards" ? "table" : "cards"}`)}
                className={`btn btn-sm ${view === "cards" ? "btn-primary" : "btn-ghost"}`}
                aria-pressed={view === "cards"}
                title={dict["units.viewCards"]}
              >
                <LayoutGrid size={15} strokeWidth={1.7} aria-hidden="true" />
                {dict["units.viewCards"]}
              </Link>
            </div>
            <Link
              href={showForm ? `/buildings/${id}/units` : `/buildings/${id}/units?new=1`}
              className="btn btn-primary"
            >
              <Plus size={16} strokeWidth={1.7} aria-hidden="true" />
              {dict["units.add"]}
            </Link>
          </>
        }
      />

      {isDemoMode() ? <DemoBanner message={dict["common.demoReadOnly"]} /> : null}

      <Suspense fallback={null}>
        <PeriodPicker
          period={period}
          showMonth={false}
          labels={{
            fiscalYear: dict["common.fiscalYear"],
            month: dict["common.month"],
            locale,
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <UnitFilters
          labels={{
            search: dict["common.search"],
            placeholder: dict["common.searchPlaceholder"],
            status: dict["common.status"],
            all: dict["common.all"],
            floor: dict["common.floor"],
            statusPaid: dict["units.statusPaid"],
            statusPartial: dict["units.statusPartial"],
            statusUnpaid: dict["units.statusUnpaid"],
          }}
          initial={{ q: search, status, floor, floors }}
        />
      </Suspense>

      {showForm ? (
        <div className="mb-4">
          <Panel title={dict["units.createTitle"]} hint={dict["units.subtitle"]}>
            <UnitForm buildingId={id} labels={unitFormLabels} />
          </Panel>
        </div>
      ) : null}

      {editingUnit ? (
        <div className="mb-4">
          <Panel
            title={`${dict["units.editTitle"]} · ${editingUnit.unitNumber}`}
            hint={dict["units.subtitle"]}
            action={
              <Link href={`/buildings/${id}/units`} className="btn btn-ghost btn-sm">
                {dict["common.cancel"]}
              </Link>
            }
          >
            <UnitForm
              buildingId={id}
              unit={{
                id: editingUnit.id,
                unitNumber: editingUnit.unitNumber,
                floor: editingUnit.floor ?? "",
                titleDeedNo: editingUnit.titleDeedNo ?? "",
                hasParking: editingUnit.hasParking,
                parkingCardNo: editingUnit.parkingCardNo ?? "",
                electricityMeterNo: editingUnit.electricityMeterNo ?? "",
                waterMeterNo: editingUnit.waterMeterNo ?? "",
                ownerName: editingUnit.ownerName ?? "",
                ownerPhone: editingUnit.ownerPhone ?? "",
                tenantName: editingUnit.tenantName ?? "",
                tenantPhone: editingUnit.tenantPhone ?? "",
                rentalDeed: editingUnit.rentalDeed ?? "",
                unitArea: editingUnit.unitArea === null ? "" : String(editingUnit.unitArea),
                annualFee: String(editingUnit.annualFee),
                additionalFees: String(editingUnit.additionalFees),
              }}
              labels={unitFormLabels}
            />

            <div className="mt-5 border-t border-divider pt-4">
              <h3 className="text-[13px] font-semibold">{dict["units.photo"]}</h3>
              <p className="mt-0.5 text-[13px] text-ink-faint">{dict["units.photoHint"]}</p>
              <div className="mt-3">
                <UnitPhotoUpload
                  unitId={editingUnit.id}
                  buildingId={id}
                  photoUrl={editingUnit.photoUrl}
                  label={dict["units.uploadPhoto"]}
                  busyLabel={dict["common.saving"]}
                  errorLabel={dict["common.error"]}
                />
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "cards" ? (
        <div className="mb-4">
          {rows.length === 0 ? (
            <Panel title={dict["units.title"]}>
              <p className="py-6 text-center text-[14px] text-ink-muted">{dict["common.empty"]}</p>
            </Panel>
          ) : (
            <UnitCards
              units={rows.map(({ unit }) => ({
                id: unit.id,
                unitNumber: unit.unitNumber,
                floor: unit.floor,
                titleDeedNo: unit.titleDeedNo,
                hasParking: unit.hasParking,
                parkingCardNo: unit.parkingCardNo,
                electricityMeterNo: unit.electricityMeterNo,
                waterMeterNo: unit.waterMeterNo,
                ownerName: unit.ownerName,
                ownerPhone: unit.ownerPhone,
                tenantName: unit.tenantName,
                tenantPhone: unit.tenantPhone,
                rentalDeed: unit.rentalDeed,
                unitArea: unit.unitArea,
                annualFee: unit.annualFee,
                additionalFees: unit.additionalFees,
                photoUrl: unit.photoUrl ? transformedUrl(unit.photoUrl, 192, 192) : null,
              }))}
              settlementByUnit={settlementByUnit}
              buildingId={id}
              editHref={(unitId) => `/buildings/${id}/units?edit=${unitId}`}
              currency={currencyUnit(locale)}
              areaUnit={locale === "ar" ? "م²" : "m²"}
              labels={{
                unit: dict["units.unitNumber"],
                floor: dict["common.floor"],
                titleDeed: dict["units.titleDeed"],
                owner: dict["units.owner"],
                ownerPhone: dict["units.ownerPhone"],
                tenant: dict["units.tenant"],
                tenantPhone: dict["units.tenantPhone"],
                rentalDeed: dict["units.rentalDeed"],
                electricityMeter: dict["units.electricityMeter"],
                waterMeter: dict["units.waterMeter"],
                area: dict["units.area"],
                annualFee: dict["units.annualFee"],
                additionalFees: dict["units.additionalFees"],
                annualDue: dict["units.annualDue"],
                statusPaid: dict["units.statusPaid"],
                statusPartial: dict["units.statusPartial"],
                statusUnpaid: dict["units.statusUnpaid"],
                parkingYes: dict["units.parkingYes"],
                parkingNo: dict["units.parkingNo"],
                emptyOwner: dict["units.emptyOwner"],
                vacant: dict["units.vacant"],
                edit: dict["units.edit"],
                delete: dict["common.delete"],
                confirmDelete: dict["common.confirmDelete"],
                cancel: dict["common.cancel"],
                deleteConfirm: dict["units.deleteConfirm"],
              }}
            />
          )}
        </div>
      ) : null}

      {view === "table" ? (
        <Panel
          title={`${rows.length} ${dict["units.results"]}`}
          hint={`${dict["common.required"]}: ${formatMoney(totals.required)} ${currency} · ${dict["common.collected"]}: ${formatMoney(totals.collected)} ${currency} · ${dict["common.outstanding"]}: ${formatMoney(totals.outstanding)} ${currency}`}
        >
          <div className="-mx-5 overflow-x-auto">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>{dict["units.identity"]}</th>
                  <th>{dict["units.tenant"]}</th>
                  <th className="num">{dict["units.area"]}</th>
                  <th className="num">{dict["units.annualFee"]}</th>
                  <th className="num">{dict["common.collected"]}</th>
                  <th className="num">{dict["common.outstanding"]}</th>
                  <th>{dict["common.status"]}</th>
                  <th aria-label={dict["common.actions"]} />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ unit, settlement }) => {
                  if (!settlement) return null;
                  return (
                    <tr key={unit.id}>
                      <td>
                        <span className="flex flex-col">
                          <span className="font-medium">
                            {dict["units.unitNumber"]} {unit.unitNumber}
                            <span className="ms-2 text-[13px] font-normal text-ink-faint">
                              {dict["common.floor"]} {unit.floor ?? "·"}
                            </span>
                          </span>
                          <span className="text-[13px] text-ink-muted">
                            {unit.ownerName ?? dict["units.emptyOwner"]}
                            {unit.ownerPhone ? (
                              <span className="num ms-2 text-ink-faint" dir="ltr">
                                {unit.ownerPhone}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td>
                        {unit.tenantName ? (
                          <span className="flex flex-col">
                            <span>{unit.tenantName}</span>
                            <span className="num text-[13px] text-ink-faint" dir="ltr">
                              {unit.tenantPhone}
                            </span>
                          </span>
                        ) : (
                          <span className="text-ink-faint">{dict["units.vacant"]}</span>
                        )}
                      </td>
                      <td className="num">
                        {unit.unitArea ? (
                          <>
                            {unit.unitArea}
                            <span className="ms-1 text-[13px] text-ink-faint">
                              {locale === "ar" ? "م²" : "m²"}
                            </span>
                          </>
                        ) : (
                          <span className="text-ink-faint">·</span>
                        )}
                      </td>
                      <td className="num">
                        <Money value={unit.annualFee} unit={currencyUnit(locale)} />
                        {unit.additionalFees > 0 ? (
                          <span className="block text-[13px] text-ink-faint">
                            + <Money value={unit.additionalFees} unit={currencyUnit(locale)} />
                          </span>
                        ) : null}
                      </td>
                      <td className="num">{formatMoney(settlement.collected)}</td>
                      <td className="num">
                        {settlement.outstanding > 0 ? (
                          <span style={{ color: "var(--negative-ink)" }}>
                            {formatMoney(settlement.outstanding)}
                          </span>
                        ) : (
                          <span className="text-ink-faint">·</span>
                        )}
                      </td>
                      <td>
                        {settlement.status === "PAID" ? (
                          <StatusPill tone="positive">{dict["units.statusPaid"]}</StatusPill>
                        ) : settlement.status === "PARTIAL" ? (
                          <StatusPill tone="neutral">{dict["units.statusPartial"]}</StatusPill>
                        ) : (
                          <StatusPill tone="negative">{dict["units.statusUnpaid"]}</StatusPill>
                        )}
                      </td>
                      <td>
                        <span className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/buildings/${id}/units?edit=${unit.id}`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`${dict["units.edit"]} · ${unit.unitNumber}`}
                            title={dict["units.edit"]}
                          >
                            <Pencil size={15} strokeWidth={1.6} aria-hidden="true" />
                          </Link>
                          <DeleteButton
                            kind="unit"
                            id={unit.id}
                            buildingId={id}
                            label={`${dict["common.delete"]} · ${unit.unitNumber}`}
                            confirmLabel={dict["common.confirmDelete"]}
                            cancelLabel={dict["common.cancel"]}
                            confirmMessage={dict["units.deleteConfirm"]}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-ink-muted">{dict["common.empty"]}</p>
          ) : null}
        </Panel>
      ) : null}
    </>
  );
}
