import { GRAPHQL_ENDPOINT } from "@/lib/graphql-client";

/**
 * Admin picture uploads. Images are scaled down and re-encoded in the
 * browser, then POSTed to rareAppMn-service's `/images` endpoint, which
 * stores them and returns the URL to save on the school.
 */

const IMAGES_ENDPOINT = new URL("/images", GRAPHQL_ENDPOINT).toString();

/** The backend rejects request bodies over 1 MB. */
const MAX_UPLOAD_BYTES = 1_000_000;
const ENCODE_QUALITY = 0.85;

export const IMAGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

/** Message keys under "errors.image" in messages/*.json. */
export type ImageUploadErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "tooLarge"
  | "unreadable"
  | "processFailed"
  | "saveFailed";

/**
 * An upload failure the admin should see. `code` is the message key: show
 * t(`image.${code}`) with t = useTranslations("errors"), or t("network")
 * when `network` is set.
 */
export class ImageUploadError extends Error {
  constructor(
    readonly code: ImageUploadErrorCode | "network",
  ) {
    super(code);
  }
}

const CODES_BY_STATUS: Record<number, ImageUploadErrorCode> = {
  401: "unauthenticated",
  403: "forbidden",
  413: "tooLarge",
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Scales `file` down so its longest side is at most `maxSize` pixels and
 * re-encodes it as WebP. Browsers that can't encode WebP fall back to PNG
 * when transparency matters (logos) and JPEG otherwise (photos).
 */
export async function resizeImage(
  file: File,
  maxSize: number,
  keepTransparency: boolean,
): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageUploadError("unreadable");
  }

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new ImageUploadError("processFailed");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await canvasToBlob(canvas, "image/webp", ENCODE_QUALITY);
  const blob =
    webp?.type === "image/webp"
      ? webp
      : await canvasToBlob(canvas, keepTransparency ? "image/png" : "image/jpeg", ENCODE_QUALITY);
  if (!blob) throw new ImageUploadError("processFailed");
  if (blob.size > MAX_UPLOAD_BYTES) throw new ImageUploadError("tooLarge");
  return blob;
}

/** Uploads an image and returns the public URL it's served from. */
export async function uploadImage(image: Blob, token: string | null): Promise<string> {
  let response: Response;
  try {
    response = await fetch(IMAGES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": image.type,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: image,
    });
  } catch {
    throw new ImageUploadError("network");
  }

  if (!response.ok) {
    throw new ImageUploadError(CODES_BY_STATUS[response.status] ?? "saveFailed");
  }
  const { url } = (await response.json()) as { url: string };
  return url;
}
