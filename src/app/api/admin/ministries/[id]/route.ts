import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

/**
 * PUT /api/admin/ministries/[id]
 *
 * Updates an existing ministry (name/description/schedule/is_active).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Ministry ID is required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, schedule, is_active } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Ministry name is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    name: String(name).trim().slice(0, 200),
    description: description ? String(description).trim().slice(0, 2000) : null,
    schedule: schedule ? String(schedule).trim().slice(0, 500) : null,
  };
  if ("is_active" in body) updates.is_active = is_active !== false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ministries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[ADMIN] Update ministry error:", error);
    return NextResponse.json({ error: "Failed to update ministry" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Ministry not found" }, { status: 404 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "ministry.update" },
    userId: auth.user.id,
    resourceType: "ministry",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ ministry: data });
}

/**
 * DELETE /api/admin/ministries/[id]
 *
 * Deletes a ministry. Its ministry_members rows are removed automatically via
 * the ON DELETE CASCADE foreign key (see 001_initial_schema.sql), mirroring how
 * family deletes cascade their members.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Ministry ID is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("ministries").delete().eq("id", id);

  if (error) {
    console.error("[ADMIN] Delete ministry error:", error);
    return NextResponse.json({ error: "Failed to delete ministry" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "ministry.delete" },
    userId: auth.user.id,
    resourceType: "ministry",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
