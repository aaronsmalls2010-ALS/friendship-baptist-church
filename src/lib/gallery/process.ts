import sharp from "sharp";

/**
 * Re-encode an uploaded image into safe, web-optimized WebP derivatives.
 *
 * SECURITY / PRIVACY: passing the bytes through sharp and writing WebP with
 * default options DROPS all embedded metadata — EXIF, GPS coordinates, camera
 * info — so we never publish a congregant's location. `.rotate()` first bakes
 * in the EXIF orientation so the visual is upright once orientation data is gone.
 */

const FULL_MAX = 1800; // longest edge for the full-size image
const THUMB_MAX = 700; // longest edge for the grid thumbnail

export interface ProcessedImage {
  full: Buffer;
  thumb: Buffer;
  width: number; // dimensions of the FULL image
  height: number;
}

export async function processGalleryImage(input: Buffer): Promise<ProcessedImage> {
  // Normalize orientation once; reuse the rotated pipeline for both outputs.
  const base = sharp(input, { failOn: "error" }).rotate();

  const full = await base
    .clone()
    .resize({ width: FULL_MAX, height: FULL_MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const thumb = await base
    .clone()
    .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  return {
    full: full.data,
    thumb,
    width: full.info.width,
    height: full.info.height,
  };
}
