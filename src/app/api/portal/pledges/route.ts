import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/portal/pledges
 *
 * Returns the authenticated member's own pledges (RLS-scoped), newest first,
 * with the linked campaign name.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data, error } = await supabase
      .from("pledges")
      .select("id, campaign_id, amount, note, created_at, campaigns(name)")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch pledges error:", error);
      return NextResponse.json({ error: "Failed to fetch pledges" }, { status: 500 });
    }

    return NextResponse.json({ pledges: data ?? [] });
  } catch (err) {
    console.error("[PORTAL] Pledges GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/portal/pledges
 * Body: { campaign_id, amount, note? }
 *
 * Records a pledge for the authenticated member against an active campaign.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { campaign_id, amount, note } = body;

    if (!campaign_id || typeof campaign_id !== "string")
      return NextResponse.json({ error: "Campaign is required" }, { status: 400 });

    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0)
      return NextResponse.json({ error: "A valid pledge amount is required" }, { status: 400 });

    // Verify the campaign exists and is active before accepting the pledge.
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("id, is_active")
      .eq("id", campaign_id)
      .single();

    if (campErr || !campaign)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (!campaign.is_active)
      return NextResponse.json({ error: "This campaign is not accepting pledges" }, { status: 400 });

    const { data, error } = await supabase
      .from("pledges")
      .insert({
        campaign_id,
        profile_id: user.id,
        amount: amountNum,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[PORTAL] Create pledge error:", error);
      return NextResponse.json({ error: "Failed to record pledge" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[PORTAL] Pledges POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
