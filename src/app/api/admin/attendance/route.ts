import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

const SESSION_TYPES = ["service", "event", "group", "class"] as const;

/**
 * GET /api/admin/attendance
 *
 * Lists attendance sessions newest first, each with a present-count computed
 * from attendance_records (only rows where present = true).
 * Requires admin or super_admin role.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data: sessions, error } = await admin
    .from("attendance_sessions")
    .select("*, attendance_records(present)")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ADMIN] Fetch attendance sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }

  // Flatten the embedded records into a present_count and drop the raw rows.
  const shaped = (sessions ?? []).map((s) => {
    const records = (s.attendance_records ?? []) as { present: boolean }[];
    const present_count = records.filter((r) => r.present).length;
    const { attendance_records, ...rest } = s as Record<string, unknown> & {
      attendance_records?: unknown;
    };
    void attendance_records;
    return { ...rest, present_count };
  });

  return NextResponse.json({ sessions: shaped });
}

/**
 * POST /api/admin/attendance
 *
 * Creates a new attendance session.
 * Requires admin or super_admin role.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, session_date, type, headcount, notes, group_id } = body as {
    title?: string;
    session_date?: string;
    type?: string;
    headcount?: number;
    notes?: string;
    group_id?: string;
  };

  if (!title || !session_date) {
    return NextResponse.json(
      { error: "Missing required fields: title, session_date" },
      { status: 400 }
    );
  }

  const sessionType = SESSION_TYPES.includes((type ?? "service") as (typeof SESSION_TYPES)[number])
    ? type
    : "service";

  const insertData: Record<string, unknown> = {
    title,
    session_date,
    type: sessionType,
    created_by: auth.user.id,
  };
  if (headcount !== undefined && headcount !== null && Number.isFinite(Number(headcount))) {
    insertData.headcount = Number(headcount);
  }
  if (notes !== undefined) insertData.notes = notes;
  // Link a group only when the session is a group meeting.
  if (sessionType === "group" && typeof group_id === "string" && group_id) {
    insertData.group_id = group_id;
  }

  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from("attendance_sessions")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[ADMIN] Create attendance session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "attendance.create",
    userId: auth.user.id,
    resourceType: "attendance_session",
    resourceId: session.id,
    ip,
    userAgent,
  });

  return NextResponse.json({ session }, { status: 201 });
}
