import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/attendance/[id]/records
 *
 * Bulk upsert of who was present for a session. Accepts:
 *   { records: [{ profile_id, present }] }
 * Upserts into attendance_records on the (session_id, profile_id) unique key.
 * This is how staff mark attendance for members.
 * Requires admin or super_admin role.
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawRecords = body.records;
  if (!Array.isArray(rawRecords)) {
    return NextResponse.json({ error: "records must be an array" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Confirm the session exists before writing records.
  const { data: session, error: sErr } = await admin
    .from("attendance_sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Normalize + validate the incoming rows. Only rows with a profile_id are
  // upserted (this endpoint marks member attendance).
  const rows: { session_id: string; profile_id: string; present: boolean; recorded_by: string }[] = [];
  for (const r of rawRecords as unknown[]) {
    if (!r || typeof r !== "object") continue;
    const { profile_id, present } = r as { profile_id?: unknown; present?: unknown };
    if (typeof profile_id !== "string" || !profile_id) continue;
    rows.push({
      session_id: id,
      profile_id,
      present: present === true,
      recorded_by: auth.user.id,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid records provided" }, { status: 400 });
  }

  const { error } = await admin
    .from("attendance_records")
    .upsert(rows, { onConflict: "session_id,profile_id" });

  if (error) {
    console.error("[ADMIN] Upsert attendance records error:", error);
    return NextResponse.json({ error: "Failed to save records" }, { status: 500 });
  }

  const present_count = rows.filter((r) => r.present).length;

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "attendance.record",
    userId: auth.user.id,
    resourceType: "attendance_session",
    resourceId: id,
    ip,
    userAgent,
    metadata: { marked: rows.length, present: present_count },
  });

  return NextResponse.json({ success: true, marked: rows.length, present_count });
}
