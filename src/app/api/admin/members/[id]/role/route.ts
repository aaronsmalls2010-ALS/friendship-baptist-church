import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["member", "deacon", "minister", "admin", "super_admin"];

/**
 * PATCH /api/admin/members/[id]/role
 *
 * Updates a member's role in BOTH the profiles table AND auth user_metadata.
 * This ensures middleware, login redirects, and RLS policies all see the same role.
 *
 * Security:
 * - Caller must be admin or super_admin
 * - Only super_admin can assign admin or super_admin roles
 * - Cannot change your own role (safety measure)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;

    // Verify caller is admin
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const callerRole = user.user_metadata?.role || user.app_metadata?.role;
    if (callerRole !== "admin" && callerRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse and validate the new role
    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Only super_admin can assign admin or super_admin roles
    if (
      (role === "super_admin" || role === "admin") &&
      callerRole !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Only super admins can assign admin-level roles." },
        { status: 403 }
      );
    }

    // Prevent changing your own role
    if (targetId === user.id) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Update the profiles table
    const { error: profileError } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", targetId);

    if (profileError) {
      console.error("[ADMIN] Update profile role error:", profileError);
      return NextResponse.json(
        { error: "Failed to update profile role." },
        { status: 500 }
      );
    }

    // 2. Update auth user_metadata so middleware and login redirects work
    const { data: targetUser } = await admin.auth.admin.getUserById(targetId);
    if (targetUser?.user) {
      const { error: metaError } = await admin.auth.admin.updateUserById(
        targetId,
        {
          user_metadata: { ...targetUser.user.user_metadata, role },
        }
      );

      if (metaError) {
        console.error("[ADMIN] Update user_metadata error:", metaError);
        // Profile was already updated — log but don't fail the request
        // The get-role endpoint will self-heal on next login
      }
    }

    console.log("[AUDIT] role.change", {
      targetId,
      newRole: role,
      changedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error("[ADMIN] Role update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
