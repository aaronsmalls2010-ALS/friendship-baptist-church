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

  const { reason, void: isVoid, amount, campaign, note } = body;
  if (!reason || typeof reason !== "string" || !reason.trim())
    return NextResponse.json({ error: "A reason is required for edits" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch current for audit trail
  const { data: current } = await admin
    .from("donations").select("amount, campaign, note, archived_at").eq("id", id).single();

  if (!current) return NextResponse.json({ error: "Donation not found" }, { status: 404 });

  const updates: Record<string, unknown> = {
    metadata: { edit_reason: reason, edited_by: auth.user.id, edited_at: new Date().toISOString() },
  };

  if (isVoid) {
    updates.archived_at = new Date().toISOString();
    updates.archived_by = auth.user.id;
  } else {
    if (amount !== undefined) updates.amount = Number(amount);
    if (campaign !== undefined) updates.campaign = campaign;
    if (note !== undefined) updates.note = note;
  }

  const { error } = await admin.from("donations").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update donation" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: isVoid ? "donation.void" : "donation.update",
    userId: auth.user.id,
    resourceType: "donation",
    resourceId: id,
    metadata: { reason, before: { amount: current.amount, campaign: current.campaign }, after: updates },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
