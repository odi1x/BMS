"use client";

import { useTransition } from "react";
import { saveImageAction, IDLE_IMAGE_STATE } from "@/app/actions/images";
import { ImageKitUpload } from "@/components/upload/ImageKitUpload";

export function AvatarUpload({
  userId,
  avatarUrl,
  label,
}: {
  userId: string;
  avatarUrl: string | null;
  label: string;
}) {
  const [, startTransition] = useTransition();

  return (
    <ImageKitUpload
      target="avatar"
      entityId={userId}
      label={label}
      currentUrl={avatarUrl}
      onUploaded={(fileId, url) => {
        const formData = new FormData();
        formData.append("target", "avatar");
        formData.append("entityId", userId);
        formData.append("fileId", fileId);
        formData.append("url", url);
        startTransition(async () => {
          await saveImageAction(IDLE_IMAGE_STATE, formData);
        });
      }}
    />
  );
}
