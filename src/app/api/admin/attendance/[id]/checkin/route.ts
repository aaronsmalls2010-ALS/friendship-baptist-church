import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

// Security code alphabet — deliberately excludes visually ambiguous
// characters (0/O, 1/I/L) so a code written on a claim tag can't be misread
// at pickup. 31 symbols ^ 4 = ~923k combinations, plenty for a single session.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

/** Cryptographically-seeded 4-char A–Z/2–9 code (no ambiguous glyphs). */
function generateSecurityCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/** Shape of a checked-in child row returned to the client. */
const CHILD_RECORD_SELECT =
  "id, child_id, present, security_code, checked_in_at, checked_out_at, children(first_name, last_name, grade, allergies)";

async function assertSession(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await admin
    .from("attendance_sessions")
    .select("id")
    .eq("id", id)
    .single();
  return !error && !!data;
}

/**
 * GET /api/admin/attendance/[id]/checkin
 *
 * Two modes:
 *   • ?code=AB2C  → verify a security code for this session. Returns the
 *     matching checked-in child (for pickup lookup), or { match: null }.
 *   • (no query)  → list every child currently checked in for the session,
 *     each with its security code, so staff can run the pickup board.
 * Requires admin or super_admin role.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  if (!(await assertSession(admin, id))) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    // Codes are stored uppercase; normalize the lookup so pickup entry is
    // case-insensitive.
    const normalized = code.trim().toUpperCase();
    const { data, error } = await admin
      .from("attendance_records")
      .select(CHILD_RECORD_SELECT)
      .eq("session_id", id)
      .eq("security_code", normalized)
      .not("child_id", "is", null)
      .is("checked_out_at", null)
      .maybeSingle();

    if (error) {
      console.error("[ADMIN] Verify child code error:", error);
      return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
    }
    return NextResponse.json({ match: data ?? null });
  }

  const { data: children, error } = await admin
    .from("attendance_records")
    .select(CHILD_RECORD_SELECT)
    .eq("session_id", id)
    .not("child_id", "is", null)
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: true });

  if (error) {
    console.error("[ADMIN] Fetch checked-in children error:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }

  return NextResponse.json({ children: children ?? [] });
}

/**
 * POST /api/admin/attendance/[id]/checkin
 *
 * Checks a child into the session and issues a pickup security code.
 * Body: { child_id: string }
 * Upserts on the (session_id, child_id) unique key so re-checking the same
 * child simply reissues a fresh code. Returns the record incl. security_code.
 * Requires admin or super_admin role.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const childId = body.child_id;
  if (typeof childId !== "string" || !childId) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (!(await assertSession(admin, id))) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Confirm the child exists before issuing a code.
  const { data: child, error: cErr } = await admin
    .from("children")
    .select("id, first_name, last_name")
    .eq("id", childId)
    .maybeSingle();
  if (cErr || !child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  // Generate a code that isn't already live in THIS session, so two children
  // checked in at once can never share a pickup code. Retry a handful of times
  // before giving up (collisions are astronomically unlikely at this scale).
  const { data: existingCodes } = await admin
    .from("attendance_records")
    .select("security_code")
    .eq("session_id", id)
    .not("security_code", "is", null);
  const taken = new Set(
    (existingCodes ?? [])
      .map((r) => (r.security_code as string | null)?.toUpperCase())
      .filter(Boolean) as string[]
  );

  let code = generateSecurityCode();
  for (let attempt = 0; attempt < 8 && taken.has(code); attempt++) {
    code = generateSecurityCode();
  }

  const { data: record, error } = await admin
    .from("attendance_records")
    .upsert(
      {
        session_id: id,
        child_id: childId,
        present: true,
        security_code: code,
        checked_in_at: new Date().toISOString(),
        checked_out_at: null,
        recorded_by: auth.user.id,
      },
      { onConflict: "session_id,child_id" }
    )
    .select(CHILD_RECORD_SELECT)
    .single();

  if (error) {
    console.error("[ADMIN] Child check-in error:", error);
    return NextResponse.json({ error: "Failed to check in child" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "attendance.record",
    userId: auth.user.id,
    resourceType: "attendance_session",
    resourceId: id,
    ip,
    userAgent,
    metadata: { action: "child_check_in", child_id: childId },
  });

  return NextResponse.json({ record }, { status: 201 });
}

/**
 * DELETE /api/admin/attendance/[id]/checkin
 *
 * Checks a child out at pickup. Requires the guardian's security code to
 * match before the check-in row is removed.
 * Body: { child_id: string, security_code: string }
 * Requires admin or super_admin role.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const childId = body.child_id;
  const securityCode = body.security_code;
  if (typeof childId !== "string" || !childId) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }
  if (typeof securityCode !== "string" || !securityCode.trim()) {
    return NextResponse.json({ error: "A security code is required for checkout" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: record, error: rErr } = await admin
    .from("attendance_records")
    .select("id, security_code")
    .eq("session_id", id)
    .eq("child_id", childId)
    .is("checked_out_at", null)
    .maybeSingle();

  if (rErr) {
    console.error("[ADMIN] Lookup child record error:", rErr);
    return NextResponse.json({ error: "Failed to check out child" }, { status: 500 });
  }
  if (!record) {
    return NextResponse.json({ error: "This child isn't checked in" }, { status: 404 });
  }

  const provided = securityCode.trim().toUpperCase();
  const stored = (record.security_code as string | null)?.toUpperCase() ?? "";
  if (!stored || provided !== stored) {
    return NextResponse.json(
      { error: "That security code doesn't match. Please try again." },
      { status: 403 }
    );
  }

  // Verified pickup — mark checked out (preserves the attendance record) so the
  // child clears the pickup board but still counts toward the session's total.
  const { error } = await admin
    .from("attendance_records")
    .update({ checked_out_at: new Date().toISOString() })
    .eq("id", record.id);
  if (error) {
    console.error("[ADMIN] Child checkout error:", error);
    return NextResponse.json({ error: "Failed to check out child" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "attendance.record",
    userId: auth.user.id,
    resourceType: "attendance_session",
    resourceId: id,
    ip,
    userAgent,
    metadata: { action: "child_check_out", child_id: childId },
  });

  return NextResponse.json({ success: true });
}
