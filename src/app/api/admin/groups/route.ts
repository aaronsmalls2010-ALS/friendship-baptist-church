import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

/**
 * GET /api/admin/groups
 *
 * Returns all small groups with approved/pending member counts and the
 * leader's display name. Sorted by name.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();

  const { data: groups, error } = await admin
    .from("groups")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[ADMIN] Fetch groups error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }

  const list = groups ?? [];

  // Resolve leader display names in one bulk query.
  const leaderIds = Array.from(
    new Set(list.map((g) => g.leader_id).filter((id): id is string => !!id))
  );
  const leaderMap = new Map<string, string>();
  if (leaderIds.length > 0) {
    const { data: leaders } = await admin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", leaderIds);
    for (const l of leaders ?? []) {
      leaderMap.set(l.id, `${l.first_name ?? ""} ${l.last_name ?? ""}`.trim());
    }
  }

  // Tally member counts (approved vs pending) in one pass.
  const { data: memberRows } = await admin
    .from("group_members")
    .select("group_id, status");
  const approvedCounts = new Map<string, number>();
  const pendingCounts = new Map<string, number>();
  for (const row of memberRows ?? []) {
    const map = row.status === "pending" ? pendingCounts : approvedCounts;
    map.set(row.group_id, (map.get(row.group_id) ?? 0) + 1);
  }

  const result = list.map((g) => ({
    ...g,
    leader_name: g.leader_id ? leaderMap.get(g.leader_id) ?? null : null,
    member_count: approvedCounts.get(g.id) ?? 0,
    pending_count: pendingCounts.get(g.id) ?? 0,
  }));

  return NextResponse.json({ groups: result });
}

/**
 * POST /api/admin/groups
 *
 * Creates a new small group.
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

  const capacityNum =
    capacity === null || capacity === undefined || capacity === ""
      ? null
      : Number.isFinite(Number(capacity))
        ? Math.max(0, Math.trunc(Number(capacity)))
        : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("groups")
    .insert({
      name: String(name).trim().slice(0, 200),
      description: description ? String(description).trim().slice(0, 2000) : null,
      category: category ? String(category).trim().slice(0, 100) : null,
      meeting_day: meeting_day ? String(meeting_day).trim().slice(0, 50) : null,
      meeting_time: meeting_time ? String(meeting_time).trim().slice(0, 50) : null,
      location: location ? String(location).trim().slice(0, 200) : null,
      leader_id: leader_id ? String(leader_id) : null,
      capacity: capacityNum,
      is_active: is_active !== false,
      is_open: is_open !== false,
    })
    .select()
    .single();

  if (error) {
    console.error("[ADMIN] Create group error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }

  // Keep the roster in sync: if a leader was designated, ensure they hold an
  // approved leader membership row.
  if (data.leader_id) {
    await admin
      .from("group_members")
      .upsert(
        {
          group_id: data.id,
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
    metadata: { action: "group.create" },
    userId: auth.user.id,
    resourceType: "group",
    resourceId: data.id,
    ip,
    userAgent,
  });

  return NextResponse.json({ group: data }, { status: 201 });
}
