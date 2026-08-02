import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

/**
 * PUT /api/admin/groups/[id]
 *
 * Updates an existing small group.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    name,
    description,
    category,
    meeting_day,
    meeting_time,
    location,
    leader_id,
    capacity,
    is_active,
    is_open,
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    name: String(name).trim().slice(0, 200),
    description: description ? String(description).trim().slice(0, 2000) : null,
    category: category ? String(category).trim().slice(0, 100) : null,
    meeting_day: meeting_day ? String(meeting_day).trim().slice(0, 50) : null,
    meeting_time: meeting_time ? String(meeting_time).trim().slice(0, 50) : null,
    location: location ? String(location).trim().slice(0, 200) : null,
  };

  if ("leader_id" in body) updates.leader_id = leader_id ? String(leader_id) : null;
  if ("is_active" in body) updates.is_active = is_active !== false;
  if ("is_open" in body) updates.is_open = is_open !== false;
  if ("capacity" in body) {
    updates.capacity =
      capacity === null || capacity === undefined || capacity === ""
        ? null
        : Number.isFinite(Number(capacity))
          ? Math.max(0, Math.trunc(Number(capacity)))
          : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("groups")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[ADMIN] Update group error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Keep the roster in sync when a leader is (re)assigned via the edit form.
  if ("leader_id" in body && data.leader_id) {
    await admin
      .from("group_members")
      .upsert(
        {
          group_id: id,
          profile_id: data.leader_id,
          role: "leader",
          status: "approved",
        },
        { onConflict: "group_id,profile_id" }
      );
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "group.update" },
    userId: auth.user.id,
    resourceType: "group",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ group: data });
}

/**
 * DELETE /api/admin/groups/[id]
 *
 * Deletes a group. Its group_members rows are removed automatically via the
 * ON DELETE CASCADE foreign key.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("groups").delete().eq("id", id);

  if (error) {
    console.error("[ADMIN] Delete group error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "group.delete" },
    userId: auth.user.id,
    resourceType: "group",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
