import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/attendance/[id]
 *
 * Returns a single session plus its records joined to member names.
 * Requires admin or super_admin role.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: session, error } = await admin
    .from("attendance_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: records, error: recError } = await admin
    .from("attendance_records")
    .select("id, session_id, profile_id, child_id, present, checked_in_at, profiles(first_name, last_name)")
    .eq("session_id", id);

  if (recError) {
    console.error("[ADMIN] Fetch attendance records error:", recError);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }

  const present_count = (records ?? []).filter((r) => r.present).length;

  return NextResponse.json({ session, records: records ?? [], present_count });
}

/**
 * PATCH /api/admin/attendance/[id]
 *
 * Updates headcount / notes / title on a session.
 * Requires admin or super_admin role.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["title", "headcount", "notes"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from("attendance_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[ADMIN] Update attendance session error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "attendance.update",
    userId: auth.user.id,
    resourceType: "attendance_session",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ session });
}

/**
 * DELETE /api/admin/attendance/[id]
 *
 * Deletes a session (records cascade via ON DELETE CASCADE).
 * Requires admin or super_admin role.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("attendance_sessions").delete().eq("id", id);

  if (error) {
    console.error("[ADMIN] Delete attendance session error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "attendance.delete",
    userId: auth.user.id,
    resourceType: "attendance_session",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
