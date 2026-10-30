"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecordAction, IDLE_STATE, type DeletableKind } from "@/app/actions/records";

export function DeleteButton({
  kind,
  id,
  buildingId,
  label,
  confirmLabel,
  cancelLabel,
  confirmMessage,
}: {
  kind: DeletableKind;
  id: string;
  buildingId: string;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmMessage: string;
}) {
  const [state, formAction, pending] = useActionState(deleteRecordAction, IDLE_STATE);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setArmed(true)}
        aria-label={label}
        title={label}
      >
        <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" />
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="buildingId" value={buildingId} />
      <span className="sr-only">{confirmMessage}</span>
      <button type="submit" className="btn btn-danger btn-sm" disabled={pending}>
        {confirmLabel}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setArmed(false)}
        disabled={pending}
      >
        {cancelLabel}
      </button>
      {state.status === "error" ? (
        <span className="text-[12px] text-negative-ink" role="alert">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
