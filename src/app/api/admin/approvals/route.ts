import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type NamedRow = { profiles?: { first_name?: string; last_name?: string } | null };
function memberName(r: NamedRow): string {
  const p = r.profiles;
  return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Member" : "Member";
}

/**
 * GET /api/admin/approvals
 * Everything across the platform waiting on an admin decision. Admin+ only.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();

  const [members, ministries, groups, testimonies] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, email, created_at")
      .eq("is_approved", false)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    admin
      .from("ministry_members")
      .select("ministry_id, profile_id, joined_at, profiles(first_name, last_name), ministries(name)")
      .eq("status", "pending"),
    admin
      .from("group_members")
      .select("group_id, profile_id, joined_at, profiles(first_name, last_name), groups(name)")
      .eq("status", "pending"),
    admin
      .from("testimonies")
      .select("id, author_name, content, created_at")
      .eq("is_approved", false)
      .order("created_at", { ascending: true }),
  ]);

  const ministryReqs = (ministries.data ?? []).map((r) => ({
    ministry_id: r.ministry_id,
    profile_id: r.profile_id,
    member_name: memberName(r as NamedRow),
    ministry_name: (r.ministries as unknown as { name?: string } | null)?.name ?? "Ministry",
    joined_at: r.joined_at,
  }));
  const groupReqs = (groups.data ?? []).map((r) => ({
    group_id: r.group_id,
    profile_id: r.profile_id,
    member_name: memberName(r as NamedRow),
    group_name: (r.groups as unknown as { name?: string } | null)?.name ?? "Group",
    joined_at: r.joined_at,
  }));

  const memberList = members.data ?? [];
  const testimonyList = (testimonies.data ?? []).map((t) => ({
    id: t.id,
    author_name: t.author_name,
    excerpt: (t.content ?? "").slice(0, 140),
    created_at: t.created_at,
  }));

  return NextResponse.json({
    members: memberList,
    ministries: ministryReqs,
    groups: groupReqs,
    testimonies: testimonyList,
    total: memberList.length + ministryReqs.length + groupReqs.length + testimonyList.length,
  });
}

/**
 * POST /api/admin/approvals
 * Body: { type: "member"|"ministry"|"group"|"testimony", action: "approve"|"deny", ...ids }
 * Admin+ only.
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

  const type = body.type as string;
  const action = body.action as string;
  if (!["member", "ministry", "group", "testimony"].includes(type))
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (!["approve", "deny"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const admin = createAdminClient();
  const approve = action === "approve";
  let error: { message: string } | null = null;

  if (type === "member") {
    const id = body.id as string;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (approve) {
      ({ error } = await admin.from("profiles").update({ is_approved: true }).eq("id", id));
    } else {
      // Deny = archive the unapproved signup (reversible; keeps the record).
      ({ error } = await admin
        .from("profiles")
        .update({ archived_at: new Date().toISOString(), archived_by: auth.user.id })
        .eq("id", id));
    }
  } else if (type === "ministry" || type === "group") {
    const profileId = body.profile_id as string;
    const parentId = (type === "ministry" ? body.ministry_id : body.group_id) as string;
    const table = type === "ministry" ? "ministry_members" : "group_members";
    const parentCol = type === "ministry" ? "ministry_id" : "group_id";
    if (!profileId || !parentId)
      return NextResponse.json({ error: "profile_id and parent id required" }, { status: 400 });
    if (approve) {
      ({ error } = await admin
        .from(table)
        .update({ status: "approved" })
        .eq(parentCol, parentId)
        .eq("profile_id", profileId));
    } else {
      ({ error } = await admin
        .from(table)
        .delete()
        .eq(parentCol, parentId)
        .eq("profile_id", profileId));
    }
  } else {
    // testimony
    const id = body.id as string;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (approve) {
      ({ error } = await admin.from("testimonies").update({ is_approved: true }).eq("id", id));
    } else {
      ({ error } = await admin.from("testimonies").delete().eq("id", id));
    }
  }

  if (error) {
    console.error("[ADMIN] Approval action error:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    userId: auth.user.id,
    resourceType: `${type}_approval`,
    metadata: { action, ...body },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
