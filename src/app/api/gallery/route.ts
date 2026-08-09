import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryPhoto } from "@/types";

export const dynamic = "force-dynamic";

const PUBLIC_BUCKET = "gallery-public";
const PAGE_SIZE = 60;

/**
 * GET /api/gallery?album=<slug>&offset=<n>
 *
 * Public feed of APPROVED photos, newest first, plus the album list with
 * counts (for the filter chips). Only approved rows are ever returned here.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const albumSlug = request.nextUrl.searchParams.get("album");
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || 0);

    // Albums + approved counts for the filter chips.
    const [{ data: albums }, { data: approvedAlbumRows }] = await Promise.all([
      admin.from("gallery_albums").select("id, name, slug, sort_order").order("sort_order"),
      admin.from("gallery_photos").select("album_id").eq("status", "approved"),
    ]);

    const counts = new Map<string, number>();
    let total = 0;
    for (const row of approvedAlbumRows ?? []) {
      total += 1;
      if (row.album_id) counts.set(row.album_id, (counts.get(row.album_id) ?? 0) + 1);
    }
    const albumsOut = (albums ?? [])
      .map((a) => ({ ...a, count: counts.get(a.id) ?? 0 }))
      .filter((a) => a.count > 0);

    // Resolve the album filter (slug → id).
    let filterAlbumId: string | null = null;
    if (albumSlug) {
      const match = (albums ?? []).find((a) => a.slug === albumSlug);
      if (match) filterAlbumId = match.id;
    }

    let query = admin
      .from("gallery_photos")
      .select("id, uploader_name, caption, album_id, image_path, thumb_path, width, height, created_at, approved_at, gallery_albums(name, slug)")
      .eq("status", "approved")
      .order("approved_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (filterAlbumId) query = query.eq("album_id", filterAlbumId);

    const { data: rows, error } = await query;
    if (error) {
      console.error("[GALLERY] list error:", error.message);
      return NextResponse.json({ error: "Could not load photos." }, { status: 500 });
    }

    const publicUrl = (path: string) =>
      admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl;

    const photos: GalleryPhoto[] = (rows ?? []).map((r) => {
      const rel = (r.gallery_albums ?? null) as unknown as
        | { name: string; slug: string }
        | { name: string; slug: string }[]
        | null;
      const album = Array.isArray(rel) ? rel[0] ?? null : rel;
      return {
        id: r.id,
        uploader_id: null,
        uploader_name: r.uploader_name,
        caption: r.caption,
        album_id: r.album_id,
        album_name: album?.name ?? null,
        album_slug: album?.slug ?? null,
        status: "approved",
        url: publicUrl(r.image_path),
        thumb_url: publicUrl(r.thumb_path),
        width: r.width,
        height: r.height,
        created_at: r.created_at,
        approved_at: r.approved_at,
      };
    });

    const filteredTotal = filterAlbumId ? counts.get(filterAlbumId) ?? 0 : total;

    return NextResponse.json({
      photos,
      albums: albumsOut,
      total: filteredTotal,
      hasMore: offset + photos.length < filteredTotal,
    });
  } catch (err) {
    console.error("[GALLERY] GET error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not load photos." }, { status: 500 });
  }
}
