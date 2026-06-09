import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = [
    "church_name", "tagline", "pastor_name",
    "address_street", "address_city", "address_state", "address_zip",
    "phone", "email", "ein", "office_hours",
    "notify_new_members", "notify_donations", "notify_prayer",
    "notify_sms_events", "notify_weekly_digest",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: auth.user.id };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organization_settings")
    .update(updates)
    .eq("id", 1);

  if (error) return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "settings.update",
    userId: auth.user.id,
    resourceType: "organization_settings",
    resourceId: "1",
    metadata: { fields: Object.keys(updates).filter((k) => k !== "updated_at" && k !== "updated_by") },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
