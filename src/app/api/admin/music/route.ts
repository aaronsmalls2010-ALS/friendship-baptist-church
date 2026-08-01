import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * GET /api/admin/music
 *
 * Fetches all music tracks ordered by created_at desc.
 * Requires admin or super_admin role.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const admin = createAdminClient();
    const { data: tracks, error } = await admin
      .from("music_tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch music tracks error:", error);
      return NextResponse.json(
        { error: "Failed to fetch music tracks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracks: tracks ?? [] });
  } catch (err) {
    console.error("[ADMIN] Music GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/music
 *
 * Creates a new music track.
 * Requires admin or super_admin role.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { title, artist, album, genre, audio_url, duration, track_type } = body;

    if (!title || !audio_url) {
      return NextResponse.json(
        { error: "Missing required fields: title, audio_url" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: track, error } = await admin
      .from("music_tracks")
      .insert({ title, artist, album, genre, audio_url, duration, track_type })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create music track error:", error);
      return NextResponse.json(
        { error: "Failed to create music track" },
        { status: 500 }
      );
    }

    return NextResponse.json({ track }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Music POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/music
 *
 * Updates an existing music track.
 * Requires admin or super_admin role.
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...raw } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const allowed = ["title", "artist", "album", "genre", "audio_url", "duration", "track_type"];
    const fields: Record<string, unknown> = {};
    for (const k of allowed) { if (k in raw) fields[k] = raw[k]; }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("music_tracks")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Music track not found" }, { status: 404 });
    }

    const { data: track, error } = await admin
      .from("music_tracks")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update music track error:", error);
      return NextResponse.json(
        { error: "Failed to update music track" },
        { status: 500 }
      );
    }

    return NextResponse.json({ track });
  } catch (err) {
    console.error("[ADMIN] Music PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/music
 *
 * Deletes a music track.
 * Requires admin or super_admin role.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("music_tracks")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Music track not found" }, { status: 404 });
    }

    const { error } = await admin.from("music_tracks").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete music track error:", error);
      return NextResponse.json(
        { error: "Failed to delete music track" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Music DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
