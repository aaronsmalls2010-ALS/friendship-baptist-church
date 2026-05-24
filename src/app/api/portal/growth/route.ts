import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* ─── Column Mapping ──────────────────────────────────────────────────
 * The TypeScript SpiritualGoal type uses `current`, `title`, and `is_completed`.
 * The DB might have `current_value` and `description` from the original schema.
 * We handle both naming conventions gracefully.
 * ──────────────────────────────────────────────────────────────────── */

/** Map a DB row to the TS SpiritualGoal shape */
function mapGoalFromDB(row: Record<string, unknown>) {
  return {
    id: row.id,
    profile_id: row.profile_id,
    type: row.type,
    title: row.title ?? row.description ?? "",
    target: row.target ?? 1,
    current: row.current ?? row.current_value ?? 0,
    period: row.period ?? "monthly",
    is_completed: row.is_completed ?? false,
    created_at: row.created_at,
  };
}

/** Map TS fields to DB column names for inserts/updates */
function mapGoalToDB(body: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};

  // Pass through known DB columns
  if (body.profile_id !== undefined) mapped.profile_id = body.profile_id;
  if (body.type !== undefined) mapped.type = body.type;
  if (body.target !== undefined) mapped.target = body.target;
  if (body.period !== undefined) mapped.period = body.period;

  // Map title → title (DB) and also try description → title
  if (body.title !== undefined) mapped.title = body.title;
  else if (body.description !== undefined) mapped.title = body.description;

  // Map current → current (DB) and also try current_value → current
  if (body.current !== undefined) mapped.current = body.current;
  else if (body.current_value !== undefined) mapped.current = body.current_value;

  // Map is_completed
  if (body.is_completed !== undefined) mapped.is_completed = body.is_completed;

  return mapped;
}

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
    const { data: rows, error } = await admin
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

    const goals = (rows || []).map(mapGoalFromDB);
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
 * Body: { type, title, target, current, period, is_completed }
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

    if (!body.type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    const dbFields = mapGoalToDB(body);
    dbFields.profile_id = user.id;
    if (dbFields.current === undefined) dbFields.current = 0;
    if (dbFields.is_completed === undefined) dbFields.is_completed = false;

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("spiritual_goals")
      .insert(dbFields)
      .select("*")
      .single();

    if (error) {
      console.error("[PORTAL] Create spiritual goal error:", error);
      return NextResponse.json(
        { error: "Failed to create goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal: mapGoalFromDB(row) }, { status: 201 });
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
 * Body: { id, title?, target?, current?, period?, is_completed?, type? }
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
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const dbFields = mapGoalToDB(rest);
    // Remove profile_id from updates (shouldn't change)
    delete dbFields.profile_id;

    if (Object.keys(dbFields).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("spiritual_goals")
      .update(dbFields)
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

    return NextResponse.json({ goal: mapGoalFromDB(row) });
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
