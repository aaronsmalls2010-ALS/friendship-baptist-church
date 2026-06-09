import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["first_name","last_name","photo_url","date_of_birth","date_of_passing",
    "obituary","scripture","scripture_text","favorite_hymn","church_roles",
    "family_message","is_published"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updates[key] = body[key]; }

  const admin = createAdminClient();
  const { error } = await admin.from("memorials").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update memorial" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({ type: "memorial.update", userId: auth.user.id, resourceType: "memorial", resourceId: id, ip, userAgent });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("memorials")
    .update({ archived_at: new Date().toISOString(), archived_by: auth.user.id })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to archive memorial" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({ type: "memorial.archive", userId: auth.user.id, resourceType: "memorial", resourceId: id, ip, userAgent });
  return NextResponse.json({ ok: true });
}
