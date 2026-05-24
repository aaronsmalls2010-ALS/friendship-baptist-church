import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/portal/giving
 *
 * Returns the authenticated user's donations, ordered by created_at descending.
 * Uses the user's own Supabase client so RLS filters to their records.
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

    const { data: donations, error } = await supabase
      .from("donations")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch donations error:", error);
      return NextResponse.json(
        { error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ donations });
  } catch (err) {
    console.error("[PORTAL] Giving GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
