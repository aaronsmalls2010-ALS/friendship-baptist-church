import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import heicConvert from "heic-convert";
import { getAuthContext } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isAllowedImage } from "@/lib/security/image-validation";
import { processGalleryImage } from "@/lib/gallery/process";

// sharp + heic decoding require the Node runtime; never statically optimize.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// HEIC decoding can be slow; give the batch room (respected up to the plan limit).
export const maxDuration = 60;

const MAX_FILES = 10;
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file (originals may arrive uncompressed)
const REVIEW_BUCKET = "gallery-review";

/** True if the bytes are an HEIC/HEIF image (ISOBMFF 'ftyp' + a heic/heif brand). */
function isHeicBytes(b: Buffer): boolean {
  if (b.length < 12) return false;
  if (!(b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70)) return false; // "ftyp"
  const brand = b.toString("latin1", 8, 12).toLowerCase();
  return [
    "heic", "heix", "heim", "heis", "hevc", "hevx", "hevm", "hevs", "mif1", "msf1",
  ].includes(brand);
}

/**
 * POST /api/gallery/upload  (multipart)
 *
 * Members upload up to 10 photos. Each is validated by magic bytes, re-encoded
 * to metadata-stripped WebP (full + thumb) via sharp, and stored in the PRIVATE
 * review bucket as a `pending` row. Nothing is public until an admin approves.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json(
      { error: "Please sign in to add photos." },
      { status: 401 }
    );
  }

  // Per-member throttle: a handful of upload batches per hour.
  const rl = await formRateLimit.check(6, `gallery-upload:${ctx.user.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "You've uploaded a lot just now — please try again later." },
      { status: 429, headers: { "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString() } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No photos were selected." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Please upload up to ${MAX_FILES} photos at a time.` },
      { status: 400 }
    );
  }

  const caption = (form.get("caption") as string | null)?.toString().trim().slice(0, 300) || null;
  const albumIdRaw = (form.get("albumId") as string | null)?.toString().trim() || null;

  const admin = createAdminClient();

  // Resolve the uploader's display name from their profile (server-trusted).
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", ctx.user.id)
    .maybeSingle();
  const uploaderName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    ctx.user.email?.split("@")[0] ||
    "Church Member";

  // Validate the album (if any) actually exists; otherwise ignore it.
  let albumId: string | null = null;
  if (albumIdRaw) {
    const { data: album } = await admin
      .from("gallery_albums")
      .select("id")
      .eq("id", albumIdRaw)
      .maybeSingle();
    albumId = album?.id ?? null;
  }

  const userId = ctx.user.id;

  // Process one file end-to-end. Returns null on success, or an error message.
  async function processOne(file: File): Promise<string | null> {
    if (file.size > MAX_BYTES) return `${file.name || "A photo"} is too large.`;
    let bytes: Buffer;
    try {
      bytes = Buffer.from(await file.arrayBuffer());
    } catch {
      return `${file.name || "A photo"} couldn't be read.`;
    }

    // Decode iPhone HEIC/HEIF here (sharp on Vercel can't) so the client never
    // has to. Everything else must be a real jpeg/png/webp/gif/avif; sharp
    // re-encodes whatever we hand it to WebP below.
    try {
      if (isHeicBytes(bytes)) {
        const jpeg = await heicConvert({ buffer: bytes, format: "JPEG", quality: 0.9 });
        bytes = Buffer.from(jpeg);
      } else if (!isAllowedImage(bytes, ["jpeg", "png", "webp", "gif", "avif"])) {
        return `${file.name || "A photo"} isn't a supported image.`;
      }
    } catch (err) {
      console.error("[GALLERY/UPLOAD] heic decode", err instanceof Error ? err.message : err);
      return `${file.name || "A photo"} couldn't be read.`;
    }

    try {
      const processed = await processGalleryImage(bytes);
      const id = randomUUID();
      const imagePath = `${userId}/${id}.webp`;
      const thumbPath = `${userId}/${id}_thumb.webp`;

      // Upload full + thumbnail in parallel.
      const [up1, up2] = await Promise.all([
        admin.storage
          .from(REVIEW_BUCKET)
          .upload(imagePath, processed.full, { contentType: "image/webp", upsert: false }),
        admin.storage
          .from(REVIEW_BUCKET)
          .upload(thumbPath, processed.thumb, { contentType: "image/webp", upsert: false }),
      ]);
      if (up1.error || up2.error) {
        await admin.storage.from(REVIEW_BUCKET).remove([imagePath, thumbPath]);
        throw new Error(up1.error?.message || up2.error?.message || "upload failed");
      }

      const { error: insErr } = await admin.from("gallery_photos").insert({
        uploader_id: userId,
        uploader_name: uploaderName,
        caption,
        album_id: albumId,
        status: "pending",
        image_path: imagePath,
        thumb_path: thumbPath,
        width: processed.width,
        height: processed.height,
      });
      if (insErr) {
        await admin.storage.from(REVIEW_BUCKET).remove([imagePath, thumbPath]);
        throw new Error(insErr.message);
      }
      return null;
    } catch (err) {
      console.error("[GALLERY/UPLOAD]", err instanceof Error ? err.message : err);
      return `${file.name || "A photo"} couldn't be processed.`;
    }
  }

  // Run in bounded-concurrency batches so sharp + HEIC decode don't spike memory.
  const CONCURRENCY = 3;
  let uploaded = 0;
  const errors: string[] = [];
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const results = await Promise.all(files.slice(i, i + CONCURRENCY).map(processOne));
    for (const r of results) {
      if (r === null) uploaded += 1;
      else errors.push(r);
    }
  }

  if (uploaded === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "None of your photos could be uploaded.", errors },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true, uploaded, failed: errors.length, errors });
}
