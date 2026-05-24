import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/growth
 *
 * Returns spiritual goals for the authenticated user, ordered by created_at descending.
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
    const { data: goals, error } = await admin
      .from("spiritual_goals")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch spiritual goals error:", error);
      return NextResponse.json(
        { error: "Failed to fetch goals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goals });
  } catch (err) {
    console.error("[PORTAL] Growth GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/growth
 *
 * Creates a new spiritual goal.
 * Body: { type, target, current_value, period, description }
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
    const { type, target, current_value, period, description } = body;

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: goal, error } = await admin
      .from("spiritual_goals")
      .insert({
        profile_id: user.id,
        type,
        target,
        current_value: current_value ?? 0,
        period,
        description,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[PORTAL] Create spiritual goal error:", error);
      return NextResponse.json(
        { error: "Failed to create goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal }, { status: 201 });
  } catch (err) {
    console.error("[PORTAL] Growth POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portal/growth
 *
 * Updates an existing spiritual goal.
 * Body: { id, current_value, ... }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: goal, error } = await admin
      .from("spiritual_goals")
      .update(updates)
      .eq("id", id)
      .eq("profile_id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("[PORTAL] Update spiritual goal error:", error);
      return NextResponse.json(
        { error: "Failed to update goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal });
  } catch (err) {
    console.error("[PORTAL] Growth PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/growth
 *
 * Deletes a spiritual goal.
 * Query params: ?id=<goal_id>
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("spiritual_goals")
      .delete()
      .eq("id", id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("[PORTAL] Delete spiritual goal error:", error);
      return NextResponse.json(
        { error: "Failed to delete goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PORTAL] Growth DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
