import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/music
 *
 * Fetches all music tracks ordered by created_at desc.
 * Requires admin or super_admin role.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...fields } = body;

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
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
