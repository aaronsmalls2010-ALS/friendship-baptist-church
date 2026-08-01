import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * GET /api/admin/sermons
 *
 * Fetches all sermons ordered by date desc.
 * Requires admin or super_admin role.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const admin = createAdminClient();
    const { data: sermons, error } = await admin
      .from("sermons")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch sermons error:", error);
      return NextResponse.json(
        { error: "Failed to fetch sermons" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sermons: sermons ?? [] });
  } catch (err) {
    console.error("[ADMIN] Sermons GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sermons
 *
 * Creates a new sermon.
 * Requires admin or super_admin role.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { title, speaker, date, scripture, topics, video_url, audio_url, description } = body;

    if (!title || !speaker || !date) {
      return NextResponse.json(
        { error: "Missing required fields: title, speaker, date" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: sermon, error } = await admin
      .from("sermons")
      .insert({ title, speaker, date, scripture, topics, video_url, audio_url, description })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create sermon error:", error);
      return NextResponse.json(
        { error: "Failed to create sermon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sermon }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Sermons POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sermons
 *
 * Updates an existing sermon.
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

    const allowed = ["title", "speaker", "date", "scripture", "topics", "video_url", "audio_url", "description"];
    const fields: Record<string, unknown> = {};
    for (const k of allowed) { if (k in raw) fields[k] = raw[k]; }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("sermons")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    const { data: sermon, error } = await admin
      .from("sermons")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update sermon error:", error);
      return NextResponse.json(
        { error: "Failed to update sermon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sermon });
  } catch (err) {
    console.error("[ADMIN] Sermons PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sermons
 *
 * Deletes a sermon.
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
      .from("sermons")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    const { error } = await admin.from("sermons").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete sermon error:", error);
      return NextResponse.json(
        { error: "Failed to delete sermon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Sermons DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
