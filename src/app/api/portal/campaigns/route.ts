import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/campaigns
 *
 * Returns active campaigns with aggregate progress (total received vs goal) for
 * the member portal's fundraising thermometers. Requires an authenticated user.
 * Only aggregate totals are exposed — never individual donor data.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = createAdminClient();

    const { data: campaigns, error } = await admin
      .from("campaigns")
      .select("id, name, description, goal_amount, start_date, end_date")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch campaigns error:", error);
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }

    const active = campaigns ?? [];
    if (active.length === 0) return NextResponse.json({ campaigns: [] });

    const ids = active.map((c) => c.id);
    const { data: donations } = await admin
      .from("donations")
      .select("campaign_id, amount")
      .in("campaign_id", ids)
      .is("archived_at", null);

    const receivedByCampaign = new Map<string, number>();
    for (const d of (donations ?? []) as { campaign_id: string | null; amount: number }[]) {
      if (!d.campaign_id) continue;
      receivedByCampaign.set(
        d.campaign_id,
        (receivedByCampaign.get(d.campaign_id) ?? 0) + Number(d.amount)
      );
    }

    const result = active.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      goal_amount: c.goal_amount != null ? Number(c.goal_amount) : null,
      start_date: c.start_date,
      end_date: c.end_date,
      total_received: receivedByCampaign.get(c.id) ?? 0,
    }));

    return NextResponse.json({ campaigns: result });
  } catch (err) {
    console.error("[PORTAL] Campaigns GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
