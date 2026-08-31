/**
 * Client-side image helpers for AI photo features.
 *
 * Phone cameras produce 3–12MB files; sending those as base64 data URLs
 * blows past request body limits and gateway size caps, which was the root
 * cause of "scanner accepts a picture but produces no analysis". Always
 * downscale before upload.
 */

export interface DownscaleOptions {
  maxDim?: number;
  quality?: number;
  maxBytes?: number;
}

/**
 * Downscale an image file to a JPEG data URL.
 * Defaults target ≤ ~900KB so the payload stays well under server limits.
 */
export async function fileToScaledDataUrl(file: File, opts: DownscaleOptions = {}): Promise<string> {
  const maxDim = opts.maxDim ?? 1024;
  let quality = opts.quality ?? 0.82;
  const maxBytes = opts.maxBytes ?? 900_000;

  const bitmap = await createImageBitmap(file).catch(() => null);
  let img: ImageBitmap | HTMLImageElement;
  try {
    img = bitmap ?? (await loadImage(file));
  } catch (e) {
    // Some phone formats (e.g. HEIC on non-Safari browsers) can't be decoded to a
    // canvas. Send the original bytes instead of failing the scan outright.
    const raw = await fileToDataUrl(file);
    if (raw.length * 0.75 <= 3_500_000) return raw;
    throw e;
  }

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);
  if (bitmap) bitmap.close();

  let url = canvas.toDataURL("image/jpeg", quality);
  // Shrink quality until the payload fits the byte budget (base64 ≈ 4/3x).
  while (url.length * 0.75 > maxBytes && quality > 0.4) {
    quality -= 0.1;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      res(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("Couldn't read that image — try another photo."));
    };
    img.src = url;
  });
}

/** Read a file straight to a data URL, no re-encode. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}

/** Rough byte size of a base64 data URL payload. */
export function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  return Math.round(((dataUrl.length - i - 1) * 3) / 4);
}
