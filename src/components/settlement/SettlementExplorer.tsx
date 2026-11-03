"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { SettlementSummary } from "@/lib/analytics";
import type { UnitSettlement } from "@/lib/types";

export type SettlementLabels = {
  towerTitle: string;
  towerHint: string;
  floor: string;
  unit: string;
  paid: string;
  partial: string;
  unpaid: string;
  collected: string;
  required: string;
  outstanding: string;
  rate: string;
  ofRequired: string;
  allUnits: string;
  lastPayment: string;
  openAudit: string;
  clear: string;
  selectUnit: string;
};

export type SettlementExplorerProps = {
  units: UnitSettlement[];
  summary: SettlementSummary;
  locale: "ar" | "en";
  currency: string;
  labels: SettlementLabels;
  auditHref: string;
  children?: React.ReactNode;
};

type FloorGroup = {
  floor: string;
  units: UnitSettlement[];
};

function floorLabel(floor: string | null): string {
  if (!floor) return "—";
  return floor;
}

function groupByFloor(units: UnitSettlement[]): FloorGroup[] {
  const groups = new Map<string, UnitSettlement[]>();
  for (const unit of units) {
    const key = floorLabel(unit.floor);
    const bucket = groups.get(key) ?? [];
    bucket.push(unit);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .map(([floor, rows]) => ({
      floor,
      units: rows.sort((a, b) =>
        a.unitNumber.localeCompare(b.unitNumber, "en", { numeric: true }),
      ),
    }))
    .sort((a, b) => {
      const left = Number(a.floor);
      const right = Number(b.floor);
      if (Number.isFinite(left) && Number.isFinite(right)) return right - left;
      if (Number.isFinite(left)) return -1;
      if (Number.isFinite(right)) return 1;
      return a.floor.localeCompare(b.floor, "en");
    });
}

export function SettlementExplorer({
  units,
  summary,
  locale,
  currency,
  labels,
  auditHref,
  children,
}: SettlementExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);
  const floors = useMemo(() => groupByFloor(units), [units]);
  const selected = selectedId ? units.find((unit) => unit.unitId === selectedId) ?? null : null;

  const pick = (unitId: string | null) => {
    setAnimated(true);
    setSelectedId(unitId);
  };

  const dateFormat = locale === "ar" ? "ar-SA" : "en-GB";

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[306px_minmax(0,1fr)]">
      <section className="tower xl:sticky xl:top-8">
        <header className="tower-head">
          <h2 className="panel-title">{labels.towerTitle}</h2>
          <p className="panel-hint mt-0.5">{labels.towerHint}</p>
        </header>

        <div>
          {floors.map((group) => {
            const paid = group.units.filter((unit) => unit.status === "PAID").length;
            return (
              <div key={group.floor} className="tower-floor">
                <span className="tower-floor-label">
                  {labels.floor} {group.floor}
                </span>
                <span className="tower-cells">
                  {group.units.map((unit) => {
                    const state =
                      unit.status === "PAID"
                        ? labels.paid
                        : unit.status === "PARTIAL"
                          ? labels.partial
                          : labels.unpaid;
                    const isSelected = selectedId === unit.unitId;
                    return (
                      <button
                        key={unit.unitId}
                        type="button"
                        className="tower-cell"
                        data-state={unit.status}
                        data-selected={isSelected ? "true" : undefined}
                        aria-pressed={isSelected}
                        aria-label={`${labels.unit} ${unit.unitNumber} — ${state}`}
                        title={`${labels.unit} ${unit.unitNumber} — ${state}`}
                        onClick={() => pick(isSelected ? null : unit.unitId)}
                      />
                    );
                  })}
                </span>
                <span className="tower-count num">
                  {paid}/{group.units.length}
                </span>
              </div>
            );
          })}
        </div>

        <div className="tower-legend">
          <span className="tower-legend-item">
            <span className="tower-swatch" data-state="PAID" />
            {labels.paid}
          </span>
          <span className="tower-legend-item">
            <span className="tower-swatch" data-state="PARTIAL" />
            {labels.partial}
          </span>
          <span className="tower-legend-item">
            <span className="tower-swatch" />
            {labels.unpaid}
          </span>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <section
          key={selected?.unitId ?? "building"}
          className="panel settlement-body lg:col-span-2"
          data-animated={animated ? "true" : "false"}
        >
          <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0">
              <h2 className="panel-title">
                {selected ? `${labels.unit} ${selected.unitNumber}` : labels.rate}
              </h2>
              <p className="panel-hint mt-0.5">
                {selected
                  ? selected.floor
                    ? `${labels.floor} ${selected.floor}`
                    : labels.floor
                  : labels.ofRequired}
              </p>
            </div>
            {selected ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => pick(null)}
              >
                {labels.clear}
              </button>
            ) : null}
          </header>

          <div className="px-5 pb-5">
            {selected ? (
              <SelectedSettlement
                unit={selected}
                currency={currency}
                dateFormat={dateFormat}
                labels={labels}
                auditHref={auditHref}
              />
            ) : (
              <BuildingSettlement
                summary={summary}
                currency={currency}
                labels={labels}
                units={units}
              />
            )}
          </div>
        </section>

        {children}
      </div>
    </div>
  );
}

function BuildingSettlement({
  summary,
  currency,
  labels,
  units,
}: {
  summary: SettlementSummary;
  currency: string;
  labels: SettlementLabels;
  units: UnitSettlement[];
}) {
  const paidCollected = units
    .filter((unit) => unit.status === "PAID")
    .reduce((sum, unit) => sum + unit.collected, 0);
  const partialCollected = units
    .filter((unit) => unit.status === "PARTIAL")
    .reduce((sum, unit) => sum + unit.collected, 0);
  const paidRatio = summary.required === 0 ? 0 : (paidCollected / summary.required) * 100;
  const partialRatio =
    summary.required === 0 ? 0 : Math.max(0, Math.min(100 - paidRatio, (partialCollected / summary.required) * 100));

  return (
    <>
      <p className="metric-value metric-answer text-ink">{summary.collectionRate}%</p>
      <p className="mt-1 text-[14px] text-ink-muted">
        <span className="num">{formatMoney(summary.collected)}</span>{" "}
        <span className="text-ink-faint">{currency}</span> {labels.collected}{" "}
        <span className="text-ink-faint">·</span>{" "}
        <span className="num">{formatMoney(summary.required)}</span>{" "}
        <span className="text-ink-faint">{currency}</span> {labels.required}
      </p>

      <div className="mt-4">
        <div className="track-label">
          <span>
            {summary.paid} {labels.paid}
          </span>
          <span>
            {summary.partial} {labels.partial} · {summary.unpaid} {labels.unpaid}
          </span>
        </div>
        <div
          className="track"
          role="img"
          aria-label={`${labels.rate} ${summary.collectionRate}%`}
        >
          <span className="track-fill" style={{ width: `${Math.min(100, paidRatio)}%` }} />
          <span className="track-partial" style={{ width: `${partialRatio}%` }} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-divider pt-4">
        <div>
          <dt className="text-[12px] text-ink-faint">{labels.paid}</dt>
          <dd className="num mt-0.5 text-[18px] font-medium">{summary.paid}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-ink-faint">{labels.partial}</dt>
          <dd className="num mt-0.5 text-[18px] font-medium">{summary.partial}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-ink-faint">{labels.unpaid}</dt>
          <dd className="num mt-0.5 text-[18px] font-medium text-negative-ink">
            {summary.unpaid}
          </dd>
        </div>
      </dl>
    </>
  );
}

function SelectedSettlement({
  unit,
  currency,
  dateFormat,
  labels,
  auditHref,
}: {
  unit: UnitSettlement;
  currency: string;
  dateFormat: string;
  labels: SettlementLabels;
  auditHref: string;
}) {
  const ratio = unit.required === 0 ? 0 : Math.min(100, (unit.collected / unit.required) * 100);
  const state =
    unit.status === "PAID"
      ? labels.paid
      : unit.status === "PARTIAL"
        ? labels.partial
        : labels.unpaid;

  return (
    <>
      <p className="metric-value metric-answer text-ink">
        {unit.required === 0 ? "0" : Math.round(ratio)}%
      </p>
      <p className="mt-1 text-[14px] text-ink-muted">
        <span className="num">{formatMoney(unit.collected)}</span>{" "}
        <span className="text-ink-faint">{currency}</span> {labels.collected}{" "}
        <span className="text-ink-faint">·</span>{" "}
        <span className="num">{formatMoney(unit.required)}</span>{" "}
        <span className="text-ink-faint">{currency}</span> {labels.required}
      </p>

      <div className="mt-4">
        <div className="track-label">
          <span>{state}</span>
          <span>
            {unit.outstanding > 0 ? (
              <>
                <span className="num">{formatMoney(unit.outstanding)}</span>{" "}
                <span className="text-ink-faint">{currency}</span> {labels.outstanding}
              </>
            ) : (
              labels.paid
            )}
          </span>
        </div>
        <div className="track" role="img" aria-label={`${state} ${Math.round(ratio)}%`}>
          <span className="track-fill" style={{ width: `${ratio}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4">
        <p className="text-[12px] text-ink-faint">
          {unit.lastPaymentDate ? (
            <>
              {labels.lastPayment}{" "}
              <span className="num">
                {new Intl.DateTimeFormat(dateFormat, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(unit.lastPaymentDate)}
              </span>
            </>
          ) : (
            labels.selectUnit
          )}
        </p>
        <Link href={auditHref} className="btn btn-secondary btn-sm">
          {labels.openAudit}
          <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" className="rtl:rotate-180" />
        </Link>
      </div>
    </>
  );
}
