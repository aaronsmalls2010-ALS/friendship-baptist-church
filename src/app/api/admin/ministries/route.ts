import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

/**
 * GET /api/admin/ministries
 *
 * Returns all ministries with member counts.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ministries")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[ADMIN] Fetch ministries error:", error);
    return NextResponse.json({ error: "Failed to fetch ministries" }, { status: 500 });
  }

  return NextResponse.json({ ministries: data ?? [] });
}

/**
 * POST /api/admin/ministries
 *
 * Creates a new ministry.
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

  const { name, description, schedule, is_active } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Ministry name is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ministries")
    .insert({
      name: String(name).trim().slice(0, 200),
      description: description ? String(description).trim().slice(0, 2000) : null,
      schedule: schedule ? String(schedule).trim().slice(0, 500) : null,
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) {
    console.error("[ADMIN] Create ministry error:", error);
    return NextResponse.json({ error: "Failed to create ministry" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "ministry.create" },
    userId: auth.user.id,
    resourceType: "ministry",
    resourceId: data.id,
    ip,
    userAgent,
  });

  return NextResponse.json({ ministry: data }, { status: 201 });
}
