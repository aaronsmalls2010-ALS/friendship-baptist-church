import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/groups
 *
 * Returns all active groups with the authenticated user's membership status
 * (my_status: "approved" | "pending" | null), the leader's name, and an
 * approved member_count.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: groups, error } = await admin
      .from("groups")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[PORTAL] Fetch groups error:", error);
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }

    const list = groups ?? [];

    // Leader names.
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

    // Approved member counts across all groups.
    const { data: memberRows } = await admin
      .from("group_members")
      .select("group_id, status");
    const approvedCounts = new Map<string, number>();
    for (const row of memberRows ?? []) {
      if (row.status === "approved") {
        approvedCounts.set(row.group_id, (approvedCounts.get(row.group_id) ?? 0) + 1);
      }
    }

    // This user's own membership rows.
    const { data: myRows } = await admin
      .from("group_members")
      .select("group_id, status, role")
      .eq("profile_id", user.id);
    const myMap = new Map(
      (myRows ?? []).map((r) => [r.group_id, { status: r.status, role: r.role }])
    );

    const result = list.map((g) => {
      const mine = myMap.get(g.id);
      return {
        ...g,
        leader_name: g.leader_id ? leaderMap.get(g.leader_id) ?? null : null,
        member_count: approvedCounts.get(g.id) ?? 0,
        my_status: mine?.status ?? null,
        my_role: mine?.role ?? null,
      };
    });

    return NextResponse.json({ groups: result });
  } catch (err) {
    console.error("[PORTAL] Groups GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/portal/groups
 *
 * Join a group. Body: { group_id: string }
 * If the group is open (is_open), the user is joined immediately (approved);
 * otherwise a pending request is created for a leader/admin to approve.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const groupId = (body?.group_id ?? "").toString();
    if (!groupId) {
      return NextResponse.json({ error: "group_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Group must exist and be active.
    const { data: group, error: groupError } = await admin
      .from("groups")
      .select("id, name, is_open, is_active, capacity")
      .eq("id", groupId)
      .eq("is_active", true)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found or inactive" }, { status: 404 });
    }

    // Already a member (or pending)?
    const { data: existing } = await admin
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `You already have a ${existing.status} membership for this group` },
        { status: 409 }
      );
    }

    // Enforce capacity for immediate (open) joins.
    const status = group.is_open ? "approved" : "pending";
    if (status === "approved" && group.capacity && group.capacity > 0) {
      const { count } = await admin
        .from("group_members")
        .select("profile_id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("status", "approved");
      if (typeof count === "number" && count >= group.capacity) {
        return NextResponse.json({ error: "This group is full" }, { status: 409 });
      }
    }

    const { data: membership, error: joinError } = await admin
      .from("group_members")
      .insert({
        group_id: groupId,
        profile_id: user.id,
        role: "member",
        status,
      })
      .select("group_id, profile_id, role, status, joined_at")
      .single();

    if (joinError) {
      console.error("[PORTAL] Join group error:", joinError);
      return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
    }

    console.log("[AUDIT] group.join", {
      groupId,
      groupName: group.name,
      profileId: user.id,
      status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ membership, status }, { status: 201 });
  } catch (err) {
    console.error("[PORTAL] Groups POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/portal/groups
 *
 * Leave a group (or cancel a pending request). Body: { group_id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const groupId = (body?.group_id ?? "").toString();
    if (!groupId) {
      return NextResponse.json({ error: "group_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 404 }
      );
    }

    const { error } = await admin
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("profile_id", user.id);

    if (error) {
      console.error("[PORTAL] Leave group error:", error);
      return NextResponse.json({ error: "Failed to leave group" }, { status: 500 });
    }

    // If this user was the designated leader, clear it.
    const { data: group } = await admin
      .from("groups")
      .select("leader_id")
      .eq("id", groupId)
      .maybeSingle();
    if (group?.leader_id === user.id) {
      await admin.from("groups").update({ leader_id: null }).eq("id", groupId);
    }

    console.log("[AUDIT] group.leave", {
      groupId,
      profileId: user.id,
      previousStatus: existing.status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PORTAL] Groups DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
