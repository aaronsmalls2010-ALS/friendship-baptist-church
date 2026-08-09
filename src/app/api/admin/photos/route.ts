import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVIEW_BUCKET = "gallery-review";
const PUBLIC_BUCKET = "gallery-public";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * GET /api/admin/photos?status=pending|approved|rejected
 * Moderation list. Pending/rejected thumbs are signed (private bucket);
 * approved thumbs use the permanent public URL.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const status = request.nextUrl.searchParams.get("status") || "pending";
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("gallery_photos")
    .select("id, uploader_name, caption, album_id, status, image_path, thumb_path, width, height, review_note, created_at, approved_at, gallery_albums(name, slug)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" ? true : false })
    .limit(300);

  if (error) {
    console.error("[ADMIN/PHOTOS] list error:", error.message);
    return NextResponse.json({ error: "Could not load photos." }, { status: 500 });
  }

  const photos = await Promise.all(
    (rows ?? []).map(async (r) => {
      const rel = (r.gallery_albums ?? null) as unknown as
        | { name: string; slug: string }
        | { name: string; slug: string }[]
        | null;
      const album = Array.isArray(rel) ? rel[0] ?? null : rel;
      let thumb_url = "";
      let url = "";
      if (r.status === "approved") {
        thumb_url = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(r.thumb_path).data.publicUrl;
        url = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(r.image_path).data.publicUrl;
      } else {
        const [t, f] = await Promise.all([
          admin.storage.from(REVIEW_BUCKET).createSignedUrl(r.thumb_path, 3600),
          admin.storage.from(REVIEW_BUCKET).createSignedUrl(r.image_path, 3600),
        ]);
        thumb_url = t.data?.signedUrl ?? "";
        url = f.data?.signedUrl ?? "";
      }
      return {
        id: r.id,
        uploader_name: r.uploader_name,
        caption: r.caption,
        album_id: r.album_id,
        album_name: album?.name ?? null,
        album_slug: album?.slug ?? null,
        status: r.status,
        url,
        thumb_url,
        width: r.width,
        height: r.height,
        review_note: r.review_note,
        created_at: r.created_at,
        approved_at: r.approved_at,
      };
    })
  );

  return NextResponse.json({ photos });
}

/**
 * POST /api/admin/photos  — moderate one or many.
 * Body: { ids: string[], action: "approve" | "reject" | "delete", note?: string }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { ids?: unknown; action?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  const action = body.action;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : null;

  if (ids.length === 0 || ids.length > 200) {
    return NextResponse.json({ error: "Select 1–200 photos." }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject" && action !== "delete") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("gallery_photos")
    .select("id, status, image_path, thumb_path")
    .in("id", ids);
  if (error) {
    return NextResponse.json({ error: "Could not load photos." }, { status: 500 });
  }

  let done = 0;
  for (const row of rows ?? []) {
    try {
      if (action === "approve") await approve(admin, row, auth.user.id, note);
      else if (action === "reject") await reject(admin, row.id, auth.user.id, note);
      else await destroy(admin, row);
      done += 1;
    } catch (err) {
      console.error("[ADMIN/PHOTOS] action error:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ ok: true, updated: done });
}

// ── helpers ──────────────────────────────────────────────────────────────────

type Row = { id: string; status: string; image_path: string; thumb_path: string };

/** Copy the derivatives review→public (paths unchanged), then flip the row. */
async function approve(admin: Admin, row: Row, adminId: string, note: string | null) {
  if (row.status !== "approved") {
    for (const path of [row.image_path, row.thumb_path]) {
      const dl = await admin.storage.from(REVIEW_BUCKET).download(path);
      if (dl.error || !dl.data) throw new Error(dl.error?.message ?? "download failed");
      const buf = Buffer.from(await dl.data.arrayBuffer());
      const up = await admin.storage
        .from(PUBLIC_BUCKET)
        .upload(path, buf, { contentType: "image/webp", upsert: true });
      if (up.error) throw new Error(up.error.message);
    }
    // Remove from the private bucket now that it lives in public.
    await admin.storage.from(REVIEW_BUCKET).remove([row.image_path, row.thumb_path]);
  }
  const { error } = await admin
    .from("gallery_photos")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_note: note,
    })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
}

async function reject(admin: Admin, id: string, adminId: string, note: string | null) {
  const { error } = await admin
    .from("gallery_photos")
    .update({
      status: "rejected",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_note: note,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function destroy(admin: Admin, row: Row) {
  const bucket = row.status === "approved" ? PUBLIC_BUCKET : REVIEW_BUCKET;
  await admin.storage.from(bucket).remove([row.image_path, row.thumb_path]);
  const { error } = await admin.from("gallery_photos").delete().eq("id", row.id);
  if (error) throw new Error(error.message);
}
