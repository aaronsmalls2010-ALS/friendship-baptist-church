/**
 * Verify an uploaded image by its MAGIC BYTES, not its client-declared MIME
 * type / data-URL prefix (both of which a caller can lie about). Returns the
 * detected type, or null if the bytes don't match a supported image format.
 */
export type DetectedImageType = "jpeg" | "png" | "webp" | "gif" | "avif";

export function sniffImageType(buf: Buffer | Uint8Array): DetectedImageType | null {
  const b = buf instanceof Buffer ? buf : Buffer.from(buf);
  if (b.length < 12) return null;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return "png";

  // GIF: "GIF87a" / "GIF89a"
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";

  // WebP: "RIFF" .... "WEBP"
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "webp";

  // AVIF (ISOBMFF): bytes 4-7 = "ftyp", brand at 8-11 = "avif"/"avis"
  if (
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
    b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && (b[11] === 0x66 || b[11] === 0x73)
  ) return "avif";

  return null;
}

/**
 * True when the decoded bytes match one of the allowed types AND agree with the
 * claimed type (when provided). SVG is intentionally unsupported (XSS vector).
 */
export function isAllowedImage(
  buf: Buffer | Uint8Array,
  allowed: DetectedImageType[],
  claimed?: string
): boolean {
  const detected = sniffImageType(buf);
  if (!detected || !allowed.includes(detected)) return false;
  if (claimed) {
    const c = claimed.toLowerCase().replace("image/", "").replace("jpg", "jpeg");
    if (c !== detected) return false;
  }
  return true;
}
