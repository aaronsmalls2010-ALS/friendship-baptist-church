import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/devotionals
 *
 * Returns devotionals ordered by date descending.
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
    const { data: devotionals, error } = await admin
      .from("devotionals")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch devotionals error:", error);
      return NextResponse.json(
        { error: "Failed to fetch devotionals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ devotionals });
  } catch (err) {
    console.error("[PORTAL] Devotionals GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
