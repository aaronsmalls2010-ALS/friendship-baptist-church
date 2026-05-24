import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/deacons
 *
 * Fetches all deacons joined with profiles and wards.
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
    const { data: deacons, error } = await admin
      .from("deacons")
      .select("*, profiles(first_name, last_name, phone, photo_url), wards(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch deacons error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deacons" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deacons: deacons ?? [] });
  } catch (err) {
    console.error("[ADMIN] Deacons GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deacons
 *
 * Creates a new deacon record.
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
    const { profile_id, ward_id, ordained_date, bio, title } = body;

    if (!profile_id) {
      return NextResponse.json(
        { error: "Missing required field: profile_id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: deacon, error } = await admin
      .from("deacons")
      .insert({ profile_id, ward_id, ordained_date, bio, title })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create deacon error:", error);
      return NextResponse.json(
        { error: "Failed to create deacon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deacon }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Deacons POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/deacons
 *
 * Updates an existing deacon record.
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
      .from("deacons")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Deacon not found" }, { status: 404 });
    }

    const { data: deacon, error } = await admin
      .from("deacons")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update deacon error:", error);
      return NextResponse.json(
        { error: "Failed to update deacon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deacon });
  } catch (err) {
    console.error("[ADMIN] Deacons PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/deacons
 *
 * Soft-deletes a deacon (sets is_active = false).
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
      .from("deacons")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Deacon not found" }, { status: 404 });
    }

    // Soft delete: set is_active = false
    const { data: deacon, error } = await admin
      .from("deacons")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Soft-delete deacon error:", error);
      return NextResponse.json(
        { error: "Failed to delete deacon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deacon });
  } catch (err) {
    console.error("[ADMIN] Deacons DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
