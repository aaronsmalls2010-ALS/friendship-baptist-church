import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthContext } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isAllowedImage } from "@/lib/security/image-validation";
import { processGalleryImage } from "@/lib/gallery/process";

// sharp requires the Node runtime; never statically optimize an upload handler.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file (client already compresses)
const REVIEW_BUCKET = "gallery-review";

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

  let uploaded = 0;
  const errors: string[] = [];

  for (const file of files) {
    try {
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name || "A photo"} is too large.`);
        continue;
      }
      const bytes = Buffer.from(await file.arrayBuffer());

      // Trust the BYTES, not the declared type. HEIC is converted to JPEG
      // client-side; every other standard format is accepted here and sharp
      // re-encodes it to WebP below.
      if (!isAllowedImage(bytes, ["jpeg", "png", "webp", "gif", "avif"])) {
        errors.push(`${file.name || "A photo"} isn't a supported image.`);
        continue;
      }

      const processed = await processGalleryImage(bytes);

      const id = randomUUID();
      const imagePath = `${ctx.user.id}/${id}.webp`;
      const thumbPath = `${ctx.user.id}/${id}_thumb.webp`;

      const up1 = await admin.storage
        .from(REVIEW_BUCKET)
        .upload(imagePath, processed.full, { contentType: "image/webp", upsert: false });
      if (up1.error) throw new Error(up1.error.message);

      const up2 = await admin.storage
        .from(REVIEW_BUCKET)
        .upload(thumbPath, processed.thumb, { contentType: "image/webp", upsert: false });
      if (up2.error) throw new Error(up2.error.message);

      const { error: insErr } = await admin.from("gallery_photos").insert({
        uploader_id: ctx.user.id,
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
        // Roll back the just-uploaded objects so we don't orphan storage.
        await admin.storage.from(REVIEW_BUCKET).remove([imagePath, thumbPath]);
        throw new Error(insErr.message);
      }

      uploaded += 1;
    } catch (err) {
      console.error("[GALLERY/UPLOAD]", err instanceof Error ? err.message : err);
      errors.push(`${file.name || "A photo"} couldn't be processed.`);
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
