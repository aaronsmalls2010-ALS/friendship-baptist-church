import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Helper: verify the caller is an admin/super_admin OR a manager of the given ministry.
 * Returns { authorized: true, callerRole } on success or an error response.
 */
async function verifyMinistryAccess(
  userId: string,
  userRole: string | undefined,
  ministryId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  // Admins and super_admins always have access
  if (userRole === "admin" || userRole === "super_admin") {
    return { authorized: true as const, callerRole: userRole };
  }

  // Check if user is a manager of this specific ministry
  const { data: managerRecord, error } = await admin
    .from("ministry_members")
    .select("id, role")
    .eq("ministry_id", ministryId)
    .eq("profile_id", userId)
    .eq("role", "manager")
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("[ADMIN] Check ministry manager error:", error);
    return { authorized: false as const, error: "Failed to verify access" };
  }

  if (!managerRecord) {
    return { authorized: false as const, error: "Unauthorized" };
  }

  return { authorized: true as const, callerRole: "manager" };
}

/**
 * GET /api/admin/ministries/[id]/members
 *
 * Returns all members of a ministry.
 * Accessible by admin/super_admin or the ministry's manager.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ministryId } = await params;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const callerRole = user.user_metadata?.role || user.app_metadata?.role;
    const admin = createAdminClient();

    const access = await verifyMinistryAccess(user.id, callerRole, ministryId, admin);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    // Fetch ministry members with profile data
    const { data: members, error } = await admin
      .from("ministry_members")
      .select(
        "*, profiles(id, first_name, last_name, email, phone, photo_url)"
      )
      .eq("ministry_id", ministryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch ministry members error:", error);
      return NextResponse.json(
        { error: "Failed to fetch ministry members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: members ?? [] });
  } catch (err) {
    console.error("[ADMIN] Ministry members GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ministries/[id]/members
 *
 * Approve or deny a ministry membership request.
 * Body: { member_id: string, action: "approve" | "deny" }
 * Accessible by admin/super_admin or the ministry's manager.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ministryId } = await params;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const callerRole = user.user_metadata?.role || user.app_metadata?.role;
    const admin = createAdminClient();

    const access = await verifyMinistryAccess(user.id, callerRole, ministryId, admin);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const body = await request.json();
    const { member_id, action } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        { error: "member_id is required" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "deny") {
      return NextResponse.json(
        { error: 'action must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Verify the membership record exists and belongs to this ministry
    const { data: memberRecord, error: fetchError } = await admin
      .from("ministry_members")
      .select("id, status, profile_id")
      .eq("id", member_id)
      .eq("ministry_id", ministryId)
      .single();

    if (fetchError || !memberRecord) {
      return NextResponse.json(
        { error: "Membership record not found" },
        { status: 404 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "denied";
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === "approve") {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.id;
    }

    const { data: updated, error: updateError } = await admin
      .from("ministry_members")
      .update(updates)
      .eq("id", member_id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[ADMIN] Update ministry member status error:", updateError);
      return NextResponse.json(
        { error: "Failed to update membership status" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] ministry.membership_action", {
      ministryId,
      memberId: member_id,
      profileId: memberRecord.profile_id,
      action,
      performedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, membership: updated });
  } catch (err) {
    console.error("[ADMIN] Ministry members PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
