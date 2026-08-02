import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_WINDOW = 4;
const MAX_WINDOW = 20;

/**
 * GET /api/admin/attendance/absences?count=N
 *
 * "Needs follow-up" report. Finds approved, non-archived members who were
 * present in NONE of the most recent N (default 4) sessions of type 'service',
 * so a deacon can reach out. Each flagged member includes the date they were
 * last seen present at any service (null if never).
 *
 * Logic:
 *   1. Take the N newest service sessions (by date, then created_at).
 *   2. Collect the profile_ids marked present in any of those sessions.
 *   3. Flag every approved member whose id is NOT in that present set.
 *   4. For each flagged member, find the most recent service they were present
 *      at (across all history) → "last seen".
 * Requires admin or super_admin role.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = Number(request.nextUrl.searchParams.get("count"));
  const windowSize =
    Number.isFinite(raw) && raw > 0 ? Math.min(Math.trunc(raw), MAX_WINDOW) : DEFAULT_WINDOW;

  const admin = createAdminClient();

  // 1. The N most recent service sessions.
  const { data: recentSessions, error: sErr } = await admin
    .from("attendance_sessions")
    .select("id, session_date")
    .eq("type", "service")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(windowSize);

  if (sErr) {
    console.error("[ADMIN] Absences: fetch sessions error:", sErr);
    return NextResponse.json({ error: "Failed to compute absences" }, { status: 500 });
  }

  const recentIds = (recentSessions ?? []).map((s) => s.id);

  // 2. All approved, non-archived members.
  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .is("archived_at", null)
    .eq("is_approved", true);

  if (pErr) {
    console.error("[ADMIN] Absences: fetch members error:", pErr);
    return NextResponse.json({ error: "Failed to compute absences" }, { status: 500 });
  }

  const members = profiles ?? [];

  // With no service sessions on record yet, nobody can be flagged.
  if (recentIds.length === 0) {
    return NextResponse.json({
      window: windowSize,
      sessions_considered: 0,
      members: [],
    });
  }

  // 3. Profile_ids present in any of the recent service sessions.
  const { data: presentRows, error: rErr } = await admin
    .from("attendance_records")
    .select("profile_id")
    .in("session_id", recentIds)
    .eq("present", true)
    .not("profile_id", "is", null);

  if (rErr) {
    console.error("[ADMIN] Absences: fetch records error:", rErr);
    return NextResponse.json({ error: "Failed to compute absences" }, { status: 500 });
  }

  const seenRecently = new Set(
    (presentRows ?? []).map((r) => r.profile_id as string).filter(Boolean)
  );

  const flagged = members.filter((m) => !seenRecently.has(m.id));
  const flaggedIds = flagged.map((m) => m.id);

  // 4. Last-seen (most recent service session_date present) for flagged members.
  const lastSeen = new Map<string, string>();
  if (flaggedIds.length > 0) {
    const { data: history } = await admin
      .from("attendance_records")
      .select("profile_id, attendance_sessions(session_date, type)")
      .eq("present", true)
      .in("profile_id", flaggedIds);

    for (const row of history ?? []) {
      const pid = row.profile_id as string | null;
      const sess = row.attendance_sessions as unknown as {
        session_date?: string;
        type?: string;
      } | null;
      if (!pid || !sess?.session_date || sess.type !== "service") continue;
      const current = lastSeen.get(pid);
      if (!current || sess.session_date > current) {
        lastSeen.set(pid, sess.session_date);
      }
    }
  }

  const result = flagged
    .map((m) => ({
      id: m.id,
      first_name: m.first_name ?? "",
      last_name: m.last_name ?? "",
      last_seen: lastSeen.get(m.id) ?? null,
    }))
    .sort((a, b) => {
      // Longest-absent first: nulls (never seen) lead, then oldest last_seen.
      if (a.last_seen === b.last_seen) {
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      }
      if (!a.last_seen) return -1;
      if (!b.last_seen) return 1;
      return a.last_seen < b.last_seen ? -1 : 1;
    });

  return NextResponse.json({
    window: windowSize,
    sessions_considered: recentIds.length,
    members: result,
  });
}
