import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/members
 *
 * Fetches all member profiles from Supabase.
 * Requires the caller to be an admin or super_admin.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Fetch all non-archived profiles using admin client
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, photo_url, ward_id, is_approved, status, membership_type, membership_date, how_joined, marital_status, occupation, created_at, updated_at")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch members error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Attach each member's full set of roles (from user_roles).
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    // Attach each member's families (id + name).
    const { data: famRows } = await admin
      .from("family_members")
      .select("profile_id, family_id, families(name)");
    const famsByUser = new Map<string, { id: string; name: string }[]>();
    for (const row of famRows ?? []) {
      const fam = row.families as unknown as { name?: string } | null;
      const list = famsByUser.get(row.profile_id) ?? [];
      list.push({ id: row.family_id, name: fam?.name ?? "Family" });
      famsByUser.set(row.profile_id, list);
    }

    // Attach each member's approved ministry memberships (id + name) with one
    // bulk query — replaces the old per-ministry N+1 fetch on the client.
    const { data: minRows } = await admin
      .from("ministry_members")
      .select("profile_id, ministries(id, name)")
      .eq("status", "approved");
    const minsByUser = new Map<string, { id: string; name: string }[]>();
    for (const row of minRows ?? []) {
      const min = row.ministries as unknown as { id?: string; name?: string } | null;
      if (!min?.id) continue;
      const list = minsByUser.get(row.profile_id) ?? [];
      list.push({ id: min.id, name: min.name ?? "Ministry" });
      minsByUser.set(row.profile_id, list);
    }

    // Attach each member's tags (id + name + color) with one bulk query on
    // profile_tags joined to tags — same map pattern as roles/families/ministries.
    const { data: tagRows } = await admin
      .from("profile_tags")
      .select("profile_id, tags(id, name, color)");
    const tagsByUser = new Map<string, { id: string; name: string; color: string | null }[]>();
    for (const row of tagRows ?? []) {
      const tag = row.tags as unknown as { id?: string; name?: string; color?: string | null } | null;
      if (!tag?.id) continue;
      const list = tagsByUser.get(row.profile_id) ?? [];
      list.push({ id: tag.id, name: tag.name ?? "Tag", color: tag.color ?? null });
      tagsByUser.set(row.profile_id, list);
    }

    const members = (profiles ?? []).map((p) => ({
      ...p,
      roles: rolesByUser.get(p.id) ?? [p.role],
      families: famsByUser.get(p.id) ?? [],
      ministries: minsByUser.get(p.id) ?? [],
      tags: tagsByUser.get(p.id) ?? [],
    }));

    return NextResponse.json({ members });
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
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ward_id, ...otherFields } = body;
    if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    const admin = createAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // Allow updating ward_id (null to unassign)
    if ("ward_id" in body) updates.ward_id = ward_id || null;

    // Allow other safe fields
    const safeFields = [
      "first_name", "last_name", "phone",
      "membership_type", "membership_date", "how_joined",
      "marital_status", "occupation",
    ];
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
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));
    const { id, hard } = body as { id?: string; hard?: boolean };
    if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    // Prevent deleting yourself
    if (id === auth.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Hard delete is irreversible and wipes giving history — reserved for a
    // super_admin who explicitly opts in. Everyone else soft-deletes (archives).
    if (hard === true) {
      if (!auth.ctx.isSuperAdmin) {
        return NextResponse.json(
          { error: "Only a super admin can permanently delete a member." },
          { status: 403 }
        );
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) {
        console.error("[ADMIN] Delete member error:", error);
        return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
      }
      return NextResponse.json({ success: true, deleted: "hard" });
    }

    // Soft delete: archive the profile so the member record and their giving
    // history survive. Archived members are filtered out of the members list.
    const { error } = await admin
      .from("profiles")
      .update({ archived_at: new Date().toISOString(), archived_by: auth.user.id })
      .eq("id", id);

    if (error) {
      console.error("[ADMIN] Archive member error:", error);
      return NextResponse.json({ error: "Failed to archive member" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: "soft" });
  } catch (err) {
    console.error("[ADMIN] Members DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
