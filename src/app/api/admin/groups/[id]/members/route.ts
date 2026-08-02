import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const PROFILE_FIELDS =
  "profiles(id, first_name, last_name, email, phone, photo_url)";

/**
 * GET /api/admin/groups/[id]/members
 *
 * Returns the full roster (approved + pending) for a group, with profile data.
 * Leaders first, then by join date.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: groupId } = await params;
  if (!groupId) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("group_members")
    .select(`group_id, profile_id, role, status, joined_at, ${PROFILE_FIELDS}`)
    .eq("group_id", groupId)
    .order("role", { ascending: false }) // "leader" sorts before "member"
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[ADMIN] Fetch group members error:", error);
    return NextResponse.json({ error: "Failed to fetch group members" }, { status: 500 });
  }

  return NextResponse.json({ members: members ?? [] });
}

/**
 * POST /api/admin/groups/[id]/members
 *
 * Directly add a member to a group (auto-approved).
 * Body: { profile_id: string, role?: "member" | "leader" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: groupId } = await params;
  if (!groupId) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profile_id;
  const role = (body.role as string) ?? "member";

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "profile_id is required" }, { status: 400 });
  }
  if (role !== "member" && role !== "leader") {
    return NextResponse.json({ error: 'role must be "member" or "leader"' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Composite PK (group_id, profile_id) — check for an existing row first.
  const { data: existing } = await admin
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing && existing.status === "approved") {
    return NextResponse.json(
      { error: "This person is already a member of this group" },
      { status: 409 }
    );
  }

  // Insert (or promote a pending request to approved).
  const { data: membership, error } = await admin
    .from("group_members")
    .upsert(
      { group_id: groupId, profile_id: profileId, role, status: "approved" },
      { onConflict: "group_id,profile_id" }
    )
    .select(`group_id, profile_id, role, status, joined_at, ${PROFILE_FIELDS}`)
    .single();

  if (error) {
    console.error("[ADMIN] Add group member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }

  // If added as a leader, reflect that on the group's designated leader.
  if (role === "leader") {
    await admin.from("groups").update({ leader_id: profileId }).eq("id", groupId);
  }

  console.log("[AUDIT] group.admin_add", {
    groupId,
    profileId,
    role,
    performedBy: auth.user.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ membership }, { status: existing ? 200 : 201 });
}

/**
 * PATCH /api/admin/groups/[id]/members
 *
 * Update a roster row's role and/or status (approve a pending request, or
 * promote/demote a leader).
 * Body: { profile_id: string, role?: "member" | "leader", status?: "pending" | "approved" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: groupId } = await params;
  if (!groupId) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profile_id;
  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "profile_id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if ("role" in body) {
    if (body.role !== "member" && body.role !== "leader") {
      return NextResponse.json({ error: 'role must be "member" or "leader"' }, { status: 400 });
    }
    updates.role = body.role;
  }
  if ("status" in body) {
    if (body.status !== "pending" && body.status !== "approved") {
      return NextResponse.json(
        { error: 'status must be "pending" or "approved"' },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from("group_members")
    .update(updates)
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .select(`group_id, profile_id, role, status, joined_at, ${PROFILE_FIELDS}`)
    .single();

  if (error) {
    console.error("[ADMIN] Update group member error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
  if (!membership) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  // Keep the group's designated leader in sync with role changes.
  if (updates.role === "leader") {
    await admin.from("groups").update({ leader_id: profileId }).eq("id", groupId);
  } else if (updates.role === "member") {
    const { data: group } = await admin
      .from("groups")
      .select("leader_id")
      .eq("id", groupId)
      .maybeSingle();
    if (group?.leader_id === profileId) {
      await admin.from("groups").update({ leader_id: null }).eq("id", groupId);
    }
  }

  console.log("[AUDIT] group.member_updated", {
    groupId,
    profileId,
    updates,
    performedBy: auth.user.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ membership });
}

/**
 * DELETE /api/admin/groups/[id]/members
 *
 * Remove a member from a group.
 * Body: { profile_id: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: groupId } = await params;
  if (!groupId) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profile_id;
  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "profile_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("[ADMIN] Remove group member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  // If we removed the designated leader, clear the group's leader_id.
  const { data: group } = await admin
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .maybeSingle();
  if (group?.leader_id === profileId) {
    await admin.from("groups").update({ leader_id: null }).eq("id", groupId);
  }

  console.log("[AUDIT] group.member_removed", {
    groupId,
    profileId,
    performedBy: auth.user.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
