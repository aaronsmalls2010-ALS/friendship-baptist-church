import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["name", "description", "sort_order", "is_active"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });

  // Prevent hard-delete of slug — only deactivate
  const admin = createAdminClient();
  const { error } = await admin.from("donation_types").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update type" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: updates.is_active === false ? "donation_type.deactivate" : "donation_type.update",
    userId: auth.user.id,
    resourceType: "donation_type",
    resourceId: id,
    metadata: updates,
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
