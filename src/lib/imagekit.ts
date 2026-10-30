import "server-only";

import ImageKit from "imagekit";

export type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
};

/** المفتاح العام — يُستخدم في المتصفح للرفع المباشر إلى ImageKit. */
export function imageKitPublicKey(): string {
  return process.env.IMAGEKIT_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? "";
}

export function imageKitConfigured(): boolean {
  return Boolean(
    imageKitPublicKey() &&
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT,
  );
}

/** نقطة النهاية التي تُبنى عليها روابط الملفات. */
export function imageKitBaseUrl(): string {
  const endpoint = (process.env.IMAGEKIT_URL_ENDPOINT ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  return endpoint ? `https://${endpoint}` : "";
}

function client(): ImageKit {
  if (!imageKitConfigured()) {
    throw new Error("IMAGEKIT_NOT_CONFIGURED");
  }

  return new ImageKit({
    publicKey: imageKitPublicKey(),
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
  });
}

export function authenticationParameters(): ImageKitAuth {
  return {
    ...(client().getAuthenticationParameters() as Omit<ImageKitAuth, "publicKey">),
    publicKey: imageKitPublicKey(),
  };
}

export type UploadResult = {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  name: string;
};

/** مجلد فرعي لكل نوع أصل داخل البرج — يسهّل الحذف والتنظيم لكل جمعية. */
export function imageKitFolder(target: string, buildingId?: string): string {
  const base = `bms/${target}`;
  return buildingId ? `${base}/${buildingId}` : base;
}

export async function uploadToImageKit(
  fileName: string,
  buffer: Buffer,
  folder: string,
): Promise<UploadResult> {
  const response = await client().upload({
    file: buffer,
    fileName,
    folder,
    useUniqueFileName: true,
  });

  return {
    fileId: response.fileId,
    url: response.url,
    thumbnailUrl: response.thumbnailUrl ?? response.url,
    name: response.name,
  };
}

/** حذف ملف من ImageKit — يُستدعى عند استبدال ختم أو صورة. */
export async function removeFromImageKit(fileId: string): Promise<void> {
  if (!fileId || !imageKitConfigured()) return;
  await client().deleteFile(fileId);
}

/**
 * رابط مصغّر مع تحويلات ImageKit (عرض ثابت + ضغط + جودة).
 * يعمل فقط مع نطاقات ImageKit؛ أي رابط خارجي يُعاد كما هو.
 */
export function transformedUrl(url: string, width: number, height: number): string {
  const base = imageKitBaseUrl();
  if (!base || !url.startsWith(base)) return url;

  const path = url.slice(base.length).replace(/^\//, "");
  return `${base}/tr:w-${width},h-${height},c-main,q-80/${path}`;
}
