import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/announcements
 *
 * Returns active announcements (published and within date range).
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

    const now = new Date().toISOString();

    const admin = createAdminClient();
    const { data: announcements, error } = await admin
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PORTAL] Fetch announcements error:", error);
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("[PORTAL] Announcements GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
