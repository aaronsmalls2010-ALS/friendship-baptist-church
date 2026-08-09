import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/gallery/albums — all albums (for the uploader's album picker). */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("gallery_albums")
      .select("id, name, slug, sort_order")
      .order("sort_order");
    if (error) {
      return NextResponse.json({ albums: [] });
    }
    return NextResponse.json({ albums: data ?? [] });
  } catch {
    return NextResponse.json({ albums: [] });
  }
}
