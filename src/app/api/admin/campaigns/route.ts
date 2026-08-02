import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

interface CampaignRow {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * GET /api/admin/campaigns
 *
 * Finance-gated. Returns every campaign with computed progress:
 *   total_pledged  = sum(pledges.amount)  for this campaign
 *   total_received = sum(donations.amount) where campaign_id = this (non-archived)
 */
export async function GET() {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();

  const [campaignsRes, pledgesRes, donationsRes] = await Promise.all([
    admin
      .from("campaigns")
      .select("id, name, description, goal_amount, start_date, end_date, is_active, created_at")
      .order("created_at", { ascending: false }),
    admin.from("pledges").select("campaign_id, amount"),
    admin.from("donations").select("campaign_id, amount").is("archived_at", null),
  ]);

  if (campaignsRes.error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });

  const pledgedByCampaign = new Map<string, number>();
  for (const p of (pledgesRes.data ?? []) as { campaign_id: string | null; amount: number }[]) {
    if (!p.campaign_id) continue;
    pledgedByCampaign.set(p.campaign_id, (pledgedByCampaign.get(p.campaign_id) ?? 0) + Number(p.amount));
  }

  const receivedByCampaign = new Map<string, number>();
  for (const d of (donationsRes.data ?? []) as { campaign_id: string | null; amount: number }[]) {
    if (!d.campaign_id) continue;
    receivedByCampaign.set(d.campaign_id, (receivedByCampaign.get(d.campaign_id) ?? 0) + Number(d.amount));
  }

  const campaigns = ((campaignsRes.data ?? []) as CampaignRow[]).map((c) => ({
    ...c,
    goal_amount: c.goal_amount != null ? Number(c.goal_amount) : null,
    total_pledged: pledgedByCampaign.get(c.id) ?? 0,
    total_received: receivedByCampaign.get(c.id) ?? 0,
  }));

  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, goal_amount, start_date, end_date, is_active } = body;

  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  let goal: number | null = null;
  if (goal_amount != null && goal_amount !== "") {
    goal = Number(goal_amount);
    if (isNaN(goal) || goal < 0)
      return NextResponse.json({ error: "Goal must be a positive number" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaigns")
    .insert({
      name: name.trim(),
      description: (description as string)?.trim() || null,
      goal_amount: goal,
      start_date: (start_date as string) || null,
      end_date: (end_date as string) || null,
      is_active: is_active === undefined ? true : Boolean(is_active),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    userId: auth.user.id,
    resourceType: "campaign",
    resourceId: data.id,
    metadata: { action: "campaign.create", name, goal_amount: goal },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
