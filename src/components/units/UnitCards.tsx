import Link from "next/link";
import { Car, Droplets, Pencil, Ruler, Zap } from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Money, StatusPill } from "@/components/ui/Money";
import type { UnitSettlement } from "@/lib/types";

export type UnitCardData = {
  id: string;
  unitNumber: string;
  floor: string | null;
  titleDeedNo: string | null;
  hasParking: boolean;
  parkingCardNo: string | null;
  electricityMeterNo: string | null;
  waterMeterNo: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  tenantName: string | null;
  tenantPhone: string | null;
  rentalDeed: string | null;
  unitArea: number | null;
  annualFee: number;
  additionalFees: number;
  photoUrl: string | null;
};

export function UnitCards({
  units,
  settlementByUnit,
  buildingId,
  editHref,
  currency,
  areaUnit,
  labels,
}: {
  units: UnitCardData[];
  settlementByUnit: Map<string, UnitSettlement>;
  buildingId: string;
  editHref: (unitId: string) => string;
  currency: string;
  areaUnit: string;
  labels: {
    unit: string;
    floor: string;
    titleDeed: string;
    owner: string;
    ownerPhone: string;
    tenant: string;
    tenantPhone: string;
    rentalDeed: string;
    electricityMeter: string;
    waterMeter: string;
    area: string;
    annualFee: string;
    additionalFees: string;
    annualDue: string;
    statusPaid: string;
    statusPartial: string;
    statusUnpaid: string;
    parkingYes: string;
    parkingNo: string;
    emptyOwner: string;
    vacant: string;
    edit: string;
    delete: string;
    confirmDelete: string;
    cancel: string;
    deleteConfirm: string;
  };
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {units.map((unit) => {
        const settlement = settlementByUnit.get(unit.id);
        return (
          <li
            key={unit.id}
            className="panel flex flex-col overflow-hidden"
          >
            <div className="flex items-start gap-3 border-b border-divider px-4 py-3">
              {unit.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={unit.photoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-[8px] border border-line object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-line bg-sunk text-[15px] font-semibold text-ink-muted"
                >
                  {unit.unitNumber.slice(0, 2)}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold tracking-[-0.01em]">
                  {labels.unit} {unit.unitNumber}
                </p>
                <p className="mt-0.5 text-[13px] text-ink-faint">
                  {labels.floor}: {unit.floor ?? "·"}
                </p>
                {settlement ? (
                  <div className="mt-1.5">
                    {settlement.status === "PAID" ? (
                      <StatusPill tone="positive">{labels.statusPaid}</StatusPill>
                    ) : settlement.status === "PARTIAL" ? (
                      <StatusPill tone="neutral">{labels.statusPartial}</StatusPill>
                    ) : (
                      <StatusPill tone="negative">{labels.statusUnpaid}</StatusPill>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Link
                  href={editHref(unit.id)}
                  className="btn btn-ghost btn-sm"
                  aria-label={`${labels.edit} · ${unit.unitNumber}`}
                  title={labels.edit}
                >
                  <Pencil size={15} strokeWidth={1.6} aria-hidden="true" />
                </Link>
                <DeleteButton
                  kind="unit"
                  id={unit.id}
                  buildingId={buildingId}
                  label={`${labels.delete} · ${unit.unitNumber}`}
                  confirmLabel={labels.confirmDelete}
                  cancelLabel={labels.cancel}
                  confirmMessage={labels.deleteConfirm}
                />
              </div>
            </div>

            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3 text-[13px]">
              <div className="col-span-2">
                <dt className="text-ink-faint">{labels.owner}</dt>
                <dd className="mt-0.5 text-ink">
                  {unit.ownerName ?? labels.emptyOwner}
                  {unit.ownerPhone ? (
                    <span className="num ms-2 text-ink-faint" dir="ltr">
                      {unit.ownerPhone}
                    </span>
                  ) : null}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-ink-faint">{labels.tenant}</dt>
                <dd className="mt-0.5 text-ink">
                  {unit.tenantName ? (
                    <>
                      {unit.tenantName}
                      {unit.tenantPhone ? (
                        <span className="num ms-2 text-ink-faint" dir="ltr">
                          {unit.tenantPhone}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-faint">{labels.vacant}</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-ink-faint">{labels.titleDeed}</dt>
                <dd className="num mt-0.5" dir="ltr">
                  {unit.titleDeedNo ?? "·"}
                </dd>
              </div>

              <div>
                <dt className="text-ink-faint">{labels.rentalDeed}</dt>
                <dd className="num mt-0.5" dir="ltr">
                  {unit.rentalDeed ?? "·"}
                </dd>
              </div>

              <div>
                <dt className="text-ink-faint">{labels.electricityMeter}</dt>
                <dd className="num mt-0.5 flex items-center gap-1.5" dir="ltr">
                  <Zap size={13} strokeWidth={1.7} aria-hidden="true" className="text-ink-faint" />
                  {unit.electricityMeterNo ?? "·"}
                </dd>
              </div>

              <div>
                <dt className="text-ink-faint">{labels.waterMeter}</dt>
                <dd className="num mt-0.5 flex items-center gap-1.5" dir="ltr">
                  <Droplets size={13} strokeWidth={1.7} aria-hidden="true" className="text-ink-faint" />
                  {unit.waterMeterNo ?? "·"}
                </dd>
              </div>

              <div>
                <dt className="text-ink-faint">{labels.area}</dt>
                <dd className="num mt-0.5 flex items-center gap-1.5">
                  <Ruler size={13} strokeWidth={1.7} aria-hidden="true" className="text-ink-faint" />
                  {unit.unitArea ? (
                    <>
                      {unit.unitArea} <span className="ms-0.5">{areaUnit}</span>
                    </>
                  ) : (
                    "·"
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-ink-faint">{labels.annualDue}</dt>
                <dd className="mt-0.5">
                  <Money value={unit.annualFee + unit.additionalFees} unit={currency} />
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-ink-faint">{labels.annualFee}</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Money value={unit.annualFee} unit={currency} />
                  {unit.additionalFees > 0 ? (
                    <span className="text-ink-faint">
                      + <Money value={unit.additionalFees} unit={currency} />
                    </span>
                  ) : null}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-ink-faint">{labels.parkingYes}</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <Car size={13} strokeWidth={1.7} aria-hidden="true" className="text-ink-faint" />
                  {unit.hasParking ? (
                    <span>
                      {labels.parkingYes}
                      {unit.parkingCardNo ? (
                        <span className="num ms-2 text-ink-faint" dir="ltr">
                          {unit.parkingCardNo}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-ink-faint">{labels.parkingNo}</span>
                  )}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
