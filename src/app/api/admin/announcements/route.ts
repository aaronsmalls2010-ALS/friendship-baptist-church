import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/announcements
 *
 * Fetches all announcements ordered by created_at desc.
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
    const { data: announcements, error } = await admin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch announcements error:", error);
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements: announcements ?? [] });
  } catch (err) {
    console.error("[ADMIN] Announcements GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 *
 * Creates a new announcement.
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
    const { title, body: announcementBody, start_date, end_date, is_pinned, is_published } = body;

    if (!title || !announcementBody) {
      return NextResponse.json(
        { error: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: announcement, error } = await admin
      .from("announcements")
      .insert({ title, body: announcementBody, start_date, end_date, is_pinned, is_published })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create announcement error:", error);
      return NextResponse.json(
        { error: "Failed to create announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Announcements POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/announcements
 *
 * Updates an existing announcement.
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
      .from("announcements")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const { data: announcement, error } = await admin
      .from("announcements")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update announcement error:", error);
      return NextResponse.json(
        { error: "Failed to update announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcement });
  } catch (err) {
    console.error("[ADMIN] Announcements PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements
 *
 * Deletes an announcement.
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
      .from("announcements")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const { error } = await admin.from("announcements").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete announcement error:", error);
      return NextResponse.json(
        { error: "Failed to delete announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Announcements DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
