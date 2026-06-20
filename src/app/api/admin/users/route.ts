import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";
import { ALL_ROLES } from "@/lib/auth/roles";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  // Get all member profiles so admins can manage anyone's roles
  const { data, error } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email, role, created_at, user_roles(role)")
    .order("last_name");

  if (error) return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, role, action } = body;
  if (!user_id || !role || !action)
    return NextResponse.json({ error: "user_id, role, and action are required" }, { status: 400 });
  if (!ALL_ROLES.includes(role as typeof ALL_ROLES[number]))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (action !== "grant" && action !== "revoke")
    return NextResponse.json({ error: "action must be grant or revoke" }, { status: 400 });

  const admin = createAdminClient();

  if (action === "grant") {
    const { error } = await admin.from("user_roles").upsert({
      user_id, role, granted_by: auth.user.id, granted_at: new Date().toISOString(),
    }, { onConflict: "user_id,role" });
    if (error) return NextResponse.json({ error: "Failed to grant role" }, { status: 500 });
  } else {
    const { error } = await admin.from("user_roles").delete()
      .eq("user_id", user_id).eq("role", role);
    if (error) return NextResponse.json({ error: "Failed to revoke role" }, { status: 500 });
  }

  // Sync user_metadata.roles
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user_id);
  const roleList = (roles ?? []).map((r: { role: string }) => r.role);
  await admin.auth.admin.updateUserById(user_id as string, {
    user_metadata: { roles: roleList, role: roleList[roleList.length - 1] ?? "member" },
  });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: action === "grant" ? "role.grant" : "role.revoke",
    userId: auth.user.id,
    resourceType: "user",
    resourceId: user_id as string,
    metadata: { role, action, target_user: user_id },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
