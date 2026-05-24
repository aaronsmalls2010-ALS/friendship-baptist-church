import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/members
 *
 * Fetches all member profiles from Supabase.
 * Requires the caller to be an admin or super_admin.
 */
export async function GET() {
  try {
    // Verify caller is admin
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

    // Fetch all profiles using admin client
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, photo_url, ward_id, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch members error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: profiles ?? [] });
  } catch (err) {
    console.error("[ADMIN] Members error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/members
 *
 * Update a member's profile (ward assignment, etc.)
 * Requires admin or super_admin.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ward_id, ...otherFields } = body;
    if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    const admin = createAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // Allow updating ward_id (null to unassign)
    if ("ward_id" in body) updates.ward_id = ward_id || null;

    // Allow other safe fields
    const safeFields = ["first_name", "last_name", "phone", "role"];
    for (const key of safeFields) {
      if (key in otherFields) updates[key] = otherFields[key];
    }

    const { error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[ADMIN] Update member error:", error);
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Members PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members
 *
 * Remove a member. Requires admin or super_admin.
 * Deletes the auth user (which cascades to profile via FK).
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    // Prevent deleting yourself
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Delete the auth user — profile cascades via FK
    const { error } = await admin.auth.admin.deleteUser(id);

    if (error) {
      console.error("[ADMIN] Delete member error:", error);
      return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
    }

    console.log("[AUDIT] member.deleted", {
      deletedId: id,
      deletedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Members DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
