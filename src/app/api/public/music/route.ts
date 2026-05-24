import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/music
 *
 * Returns all music tracks, ordered by created_at descending.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: tracks, error } = await admin
      .from("music_tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch music tracks error:", error);
      return NextResponse.json(
        { error: "Failed to fetch music tracks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracks: tracks ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Music GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
