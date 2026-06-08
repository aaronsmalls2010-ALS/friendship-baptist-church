import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_LEVEL_ROLES,
  isRole,
  primaryRole,
  rolesFromUser,
  type Role,
} from "@/lib/auth/roles";

/**
 * PATCH /api/admin/members/[id]/role
 *
 * Sets a member's COMPLETE set of roles. Body: { roles: Role[] }.
 * Writes to the `user_roles` table (a trigger keeps profiles.role = the highest
 * role) and mirrors the set into auth user_metadata (role = primary, roles = all),
 * so middleware, redirects, and RLS stay consistent.
 *
 * Security:
 * - Caller must be admin or super_admin
 * - Only super_admin can grant or revoke admin-level roles (admin / super_admin)
 * - You cannot change your own roles (lockout safety)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const callerRoles = rolesFromUser(user);
    const callerIsAdmin = callerRoles.some(
      (r) => r === "admin" || r === "super_admin"
    );
    const callerIsSuperAdmin = callerRoles.includes("super_admin");
    if (!callerIsAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (targetId === user.id) {
      return NextResponse.json(
        { error: "You cannot change your own roles." },
        { status: 400 }
      );
    }

    // Parse + validate the desired set.
    const body = await request.json();
    // Accept the new `roles` array or the legacy single `role` for back-compat.
    const rawRoles: unknown = Array.isArray(body?.roles)
      ? body.roles
      : body?.role
        ? [body.role]
        : null;

    if (!Array.isArray(rawRoles)) {
      return NextResponse.json(
        { error: "Provide a `roles` array." },
        { status: 400 }
      );
    }

    const desired = Array.from(new Set(rawRoles.filter(isRole))) as Role[];
    if (rawRoles.length && desired.length !== new Set(rawRoles).size) {
      return NextResponse.json({ error: "One or more roles are invalid." }, { status: 400 });
    }
    // Everyone is at least a member.
    if (!desired.includes("member")) desired.push("member");

    const admin = createAdminClient();

    // Current roles for the target.
    const { data: currentRows, error: curErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetId);
    if (curErr) {
      console.error("[ADMIN] role read error:", curErr);
      return NextResponse.json({ error: "Failed to read roles." }, { status: 500 });
    }
    const current = (currentRows ?? []).map((r) => r.role as Role);

    const toAdd = desired.filter((r) => !current.includes(r));
    const toRemove = current.filter((r) => !desired.includes(r));

    if (!toAdd.length && !toRemove.length) {
      return NextResponse.json({ roles: desired, primaryRole: primaryRole(desired) });
    }

    // Only super_admin may grant/revoke admin-level roles.
    const touchesAdminLevel = [...toAdd, ...toRemove].some((r) =>
      ADMIN_LEVEL_ROLES.includes(r)
    );
    if (touchesAdminLevel && !callerIsSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can grant or revoke admin-level roles." },
        { status: 403 }
      );
    }

    // Apply removals then additions.
    if (toRemove.length) {
      const { error: delErr } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", targetId)
        .in("role", toRemove);
      if (delErr) {
        console.error("[ADMIN] role remove error:", delErr);
        return NextResponse.json({ error: "Failed to update roles." }, { status: 500 });
      }
    }
    if (toAdd.length) {
      const { error: insErr } = await admin.from("user_roles").insert(
        toAdd.map((role) => ({
          user_id: targetId,
          role,
          granted_by: user.id,
        }))
      );
      if (insErr) {
        console.error("[ADMIN] role add error:", insErr);
        return NextResponse.json({ error: "Failed to update roles." }, { status: 500 });
      }
    }

    // Mirror into auth user_metadata so middleware / redirects / guards see it.
    const primary = primaryRole(desired);
    const { data: targetUser } = await admin.auth.admin.getUserById(targetId);
    if (targetUser?.user) {
      const { error: metaErr } = await admin.auth.admin.updateUserById(targetId, {
        user_metadata: {
          ...targetUser.user.user_metadata,
          role: primary,
          roles: desired,
        },
      });
      if (metaErr) {
        console.error("[ADMIN] role metadata sync error:", metaErr);
        // Roles + profiles already updated; metadata self-heals on next login.
      }
    }

    console.log("[AUDIT] roles.change", {
      targetId,
      added: toAdd,
      removed: toRemove,
      roles: desired,
      changedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ roles: desired, primaryRole: primary });
  } catch (err) {
    console.error("[ADMIN] Role update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
