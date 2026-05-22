import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/ministries
 *
 * Returns all active ministries with the authenticated user's membership status.
 * Status will be null (not a member), "pending", "approved", or "denied".
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch all active ministries
    const { data: ministries, error: ministriesError } = await admin
      .from("ministries")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (ministriesError) {
      console.error("[PORTAL] Fetch ministries error:", ministriesError);
      return NextResponse.json(
        { error: "Failed to fetch ministries" },
        { status: 500 }
      );
    }

    // Fetch user's ministry memberships
    const { data: memberships, error: membershipsError } = await admin
      .from("ministry_members")
      .select("ministry_id, status, role")
      .eq("profile_id", user.id);

    if (membershipsError) {
      console.error("[PORTAL] Fetch ministry memberships error:", membershipsError);
      return NextResponse.json(
        { error: "Failed to fetch memberships" },
        { status: 500 }
      );
    }

    // Build a lookup map of ministry_id -> membership info
    const membershipMap = new Map(
      (memberships ?? []).map((m) => [m.ministry_id, { status: m.status, role: m.role }])
    );

    // Merge membership status into each ministry
    const result = (ministries ?? []).map((ministry) => {
      const membership = membershipMap.get(ministry.id);
      return {
        ...ministry,
        user_status: membership?.status ?? null,
        user_role: membership?.role ?? null,
      };
    });

    return NextResponse.json({ ministries: result });
  } catch (err) {
    console.error("[PORTAL] Ministries GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/ministries
 *
 * Request to join a ministry.
 * Body: { ministry_id: string }
 * Creates a ministry_members record with role "member" and status "pending".
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { ministry_id } = body;

    if (!ministry_id || typeof ministry_id !== "string") {
      return NextResponse.json(
        { error: "ministry_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify the ministry exists and is active
    const { data: ministry, error: ministryError } = await admin
      .from("ministries")
      .select("id, name")
      .eq("id", ministry_id)
      .eq("active", true)
      .single();

    if (ministryError || !ministry) {
      return NextResponse.json(
        { error: "Ministry not found or inactive" },
        { status: 404 }
      );
    }

    // Check if user already has a membership record
    const { data: existing, error: existingError } = await admin
      .from("ministry_members")
      .select("id, status")
      .eq("ministry_id", ministry_id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.error("[PORTAL] Check existing membership error:", existingError);
      return NextResponse.json(
        { error: "Failed to check membership status" },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: `You already have a ${existing.status} membership for this ministry` },
        { status: 409 }
      );
    }

    // Create the membership record
    const { data: membership, error: createError } = await admin
      .from("ministry_members")
      .insert({
        ministry_id,
        profile_id: user.id,
        role: "member",
        status: "pending",
      })
      .select("*")
      .single();

    if (createError) {
      console.error("[PORTAL] Create ministry membership error:", createError);
      return NextResponse.json(
        { error: "Failed to request ministry membership" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] ministry.join_request", {
      ministryId: ministry_id,
      ministryName: ministry.name,
      profileId: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (err) {
    console.error("[PORTAL] Ministries POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
