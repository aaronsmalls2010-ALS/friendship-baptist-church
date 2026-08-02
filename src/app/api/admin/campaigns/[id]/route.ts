import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if ("name" in body) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim())
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    updates.name = body.name.trim();
  }
  if ("description" in body)
    updates.description = (body.description as string)?.trim() || null;
  if ("goal_amount" in body) {
    if (body.goal_amount == null || body.goal_amount === "") {
      updates.goal_amount = null;
    } else {
      const goal = Number(body.goal_amount);
      if (isNaN(goal) || goal < 0)
        return NextResponse.json({ error: "Goal must be a positive number" }, { status: 400 });
      updates.goal_amount = goal;
    }
  }
  if ("start_date" in body) updates.start_date = (body.start_date as string) || null;
  if ("end_date" in body) updates.end_date = (body.end_date as string) || null;
  if ("is_active" in body) updates.is_active = Boolean(body.is_active);

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("campaigns").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    userId: auth.user.id,
    resourceType: "campaign",
    resourceId: id,
    metadata: { action: "campaign.update", updates },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  // Guard: don't orphan financial records. A campaign with donations or pledges
  // linked to it is deactivated rather than hard-deleted.
  const [{ count: donationCount }, { count: pledgeCount }] = await Promise.all([
    admin.from("donations").select("id", { count: "exact", head: true }).eq("campaign_id", id),
    admin.from("pledges").select("id", { count: "exact", head: true }).eq("campaign_id", id),
  ]);

  if ((donationCount ?? 0) > 0 || (pledgeCount ?? 0) > 0) {
    const { error } = await admin.from("campaigns").update({ is_active: false }).eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to archive campaign" }, { status: 500 });

    const { ip, userAgent } = getClientInfo(request);
    await logAuditEvent({
      type: "admin.action",
      userId: auth.user.id,
      resourceType: "campaign",
      resourceId: id,
      metadata: { action: "campaign.deactivate", reason: "has linked records" },
      ip,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      deactivated: true,
      message: "Campaign has linked gifts or pledges — it was deactivated instead of deleted.",
    });
  }

  const { error } = await admin.from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    userId: auth.user.id,
    resourceType: "campaign",
    resourceId: id,
    metadata: { action: "campaign.delete" },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
