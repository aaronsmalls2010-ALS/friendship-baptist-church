import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/events
 *
 * Returns all published events, ordered by start_date descending.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Events GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
