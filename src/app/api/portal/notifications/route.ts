import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/notifications
 *
 * Returns notifications for the authenticated user, ordered by created_at descending.
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
    const { data: notifications, error } = await admin
      .from("notifications")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch notifications error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[PORTAL] Notifications GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portal/notifications
 *
 * Marks notification(s) as read.
 * Body: { ids: string[] }
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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: notifications, error } = await admin
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids)
      .eq("profile_id", user.id)
      .select("*");

    if (error) {
      console.error("[PORTAL] Mark notifications read error:", error);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[PORTAL] Notifications PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
