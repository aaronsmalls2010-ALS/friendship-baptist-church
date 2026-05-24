import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/announcements
 *
 * Returns published announcements that are currently active,
 * ordered by pinned status then start_date descending.
 */
export async function GET() {
  try {
    const now = new Date().toISOString();
    const admin = createAdminClient();
    const { data: announcements, error } = await admin
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("is_pinned", { ascending: false })
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch announcements error:", error);
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements: announcements ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Announcements GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
