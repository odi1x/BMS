"use client";

import { useActionState, useState } from "react";
import { updateBuildingAction, IDLE_STATE } from "@/app/actions/records";
import { ImageKitUpload } from "@/components/upload/ImageKitUpload";

export type BuildingSettingsValues = {
  id: string;
  name: string;
  registrationNo: string;
  unifiedId: string;
  chairmanName: string;
  address: string;
  iban: string;
  stampUrl: string | null;
};

export function BuildingSettingsForm({
  building,
  labels,
  imageKitReady,
}: {
  building: BuildingSettingsValues;
  labels: {
    name: string;
    registrationNo: string;
    unifiedId: string;
    chairmanName: string;
    address: string;
    iban: string;
    stamp: string;
    stampHint: string;
    upload: string;
    save: string;
    saving: string;
    saved: string;
    required: string;
  };
  imageKitReady: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateBuildingAction, IDLE_STATE);
  const [stampUrl, setStampUrl] = useState(building.stampUrl ?? "");
  const [stampFileId, setStampFileId] = useState("");
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={building.id} />
      <input type="hidden" name="stampUrl" value={stampUrl} />
      <input type="hidden" name="stampFileId" value={stampFileId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="buildingName">
            {labels.name}
          </label>
          <input
            id="buildingName"
            name="name"
            defaultValue={building.name}
            className="input"
            required
          />
          {errors.name ? <p className="field-hint text-negative">{errors.name}</p> : null}
        </div>

        <div>
          <label className="field-label" htmlFor="registrationNo">
            {labels.registrationNo}
          </label>
          <input
            id="registrationNo"
            name="registrationNo"
            defaultValue={building.registrationNo}
            className="input num"
            dir="ltr"
          />
          {errors.registrationNo ? (
            <p className="field-hint text-negative">{errors.registrationNo}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="unifiedId">
            {labels.unifiedId}
          </label>
          <input
            id="unifiedId"
            name="unifiedId"
            defaultValue={building.unifiedId}
            className="input num"
            dir="ltr"
          />
          {errors.unifiedId ? <p className="field-hint text-negative">{errors.unifiedId}</p> : null}
        </div>

        <div>
          <label className="field-label" htmlFor="chairmanName">
            {labels.chairmanName}
          </label>
          <input
            id="chairmanName"
            name="chairmanName"
            defaultValue={building.chairmanName}
            className="input"
          />
          {errors.chairmanName ? (
            <p className="field-hint text-negative">{errors.chairmanName}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="iban">
            {labels.iban}
          </label>
          <input
            id="iban"
            name="iban"
            defaultValue={building.iban}
            className="input num"
            dir="ltr"
          />
          {errors.iban ? <p className="field-hint text-negative">{errors.iban}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="buildingAddress">
            {labels.address}
          </label>
          <textarea
            id="buildingAddress"
            name="address"
            defaultValue={building.address}
            className="input min-h-[72px] resize-y"
            rows={2}
          />
          {errors.address ? <p className="field-hint text-negative">{errors.address}</p> : null}
        </div>
      </div>

      <div className="border-t border-divider pt-4">
        <p className="field-label">{labels.stamp}</p>
        <p className="mt-0.5 text-[12px] text-ink-faint">{labels.stampHint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {stampUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stampUrl}
              alt={labels.stamp}
              className="h-20 w-20 rounded-[10px] border border-line bg-sunk object-contain"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-[10px] border border-dashed border-line-strong text-[11px] text-ink-faint">
              {labels.stamp}
            </div>
          )}
          {imageKitReady ? (
            <ImageKitUpload
              target="stamp"
              entityId={building.id}
              label={labels.upload}
              currentUrl={stampUrl || null}
              folder={`bms/stamp/${building.id}`}
              onUploaded={(fileId, url) => {
                setStampFileId(fileId);
                setStampUrl(url);
              }}
            />
          ) : (
            <span className="text-[12px] text-ink-faint">{labels.stampHint}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.status === "error" ? (
          <p className="text-[13px] text-negative">
            {state.message === "FORM_INVALID" ? labels.required : state.message}
          </p>
        ) : null}
        {state.status === "ok" ? (
          <p className="text-[13px] text-accent-ink">{labels.save} · {labels.saved}</p>
        ) : null}
      </div>
    </form>
  );
}
