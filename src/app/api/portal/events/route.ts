import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/events
 *
 * Returns upcoming published events, ordered by start_date ascending.
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
    const { data: events, error } = await admin
      .from("events")
      .select("*")
      .eq("is_published", true)
      .gt("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[PORTAL] Fetch events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[PORTAL] Events GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
