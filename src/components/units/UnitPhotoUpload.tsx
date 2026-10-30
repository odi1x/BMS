"use client";

import { useActionState, useRef, useState } from "react";
import { ImageKitUpload } from "@/components/upload/ImageKitUpload";
import { IDLE_IMAGE_STATE, saveImageAction } from "@/app/actions/images";

export function UnitPhotoUpload({
  unitId,
  buildingId,
  photoUrl,
  label,
  busyLabel,
  errorLabel,
}: {
  unitId: string;
  buildingId: string;
  photoUrl: string | null;
  label: string;
  busyLabel: string;
  errorLabel: string;
}) {
  const [state, formAction] = useActionState(saveImageAction, IDLE_IMAGE_STATE);
  const [url, setUrl] = useState(photoUrl ?? "");
  const [fileId, setFileId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="target" value="unit-photo" />
      <input type="hidden" name="entityId" value={unitId} />
      <input type="hidden" name="url" value={url} />
      <input type="hidden" name="fileId" value={fileId} />

      <ImageKitUpload
        target="unit-photo"
        entityId={unitId}
        label={label}
        busyLabel={busyLabel}
        currentUrl={photoUrl}
        folder={`bms/unit-photo/${buildingId}`}
        onUploaded={(uploadedFileId, uploadedUrl) => {
          setFileId(uploadedFileId);
          setUrl(uploadedUrl);
          formRef.current?.requestSubmit();
        }}
      />

      {state.status === "error" ? (
        <p className="text-[12px] text-negative" role="alert">
          {errorLabel}
        </p>
      ) : null}
      {state.status === "ok" ? (
        <p className="text-[12px] text-accent-ink" role="status">
          {busyLabel}
        </p>
      ) : null}
    </form>
  );
}
