"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export type UploadTarget = "stamp" | "unit-photo" | "avatar";

type Props = {
  target: UploadTarget;
  entityId: string;
  label: string;
  busyLabel?: string;
  currentUrl?: string | null;
  /** مجلد فرعي داخل ImageKit — يميّز بين الجمعيات. */
  folder?: string;
  onUploaded: (fileId: string, url: string) => void;
};

export function ImageKitUpload({
  target,
  entityId,
  label,
  busyLabel,
  currentUrl,
  folder,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);

    try {
      const authResponse = await fetch("/api/imagekit/auth");
      if (!authResponse.ok) {
        const body = (await authResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "AUTH_FAILED");
      }

      const auth = (await authResponse.json()) as {
        token: string;
        expire: number;
        signature: string;
        publicKey: string;
      };

      const payload = new FormData();
      payload.append("file", file);
      payload.append("fileName", file.name);
      payload.append("folder", folder ?? `bms/${target}`);
      payload.append("publicKey", auth.publicKey);
      payload.append("token", auth.token);
      payload.append("expire", String(auth.expire));
      payload.append("signature", auth.signature);

      const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: payload,
      });

      if (!uploadResponse.ok) {
        throw new Error("UPLOAD_FAILED");
      }

      const uploaded = (await uploadResponse.json()) as { fileId: string; url: string };
      onUploaded(uploaded.fileId, uploaded.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "UPLOAD_FAILED");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        id={`upload-${target}-${entityId}`}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={15} strokeWidth={1.7} aria-hidden="true" />
        {busy ? (busyLabel ?? label) : label}
      </button>
      {currentUrl ? (
        <span className="num max-w-[220px] truncate text-[12px] text-ink-faint" dir="ltr">
          {currentUrl.split("/").pop()}
        </span>
      ) : null}
      {error ? (
        <span className="text-[12px] text-negative" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
