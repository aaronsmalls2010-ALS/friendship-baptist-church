import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/sermons
 *
 * Returns all sermons, ordered by date descending.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: sermons, error } = await admin
      .from("sermons")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch sermons error:", error);
      return NextResponse.json(
        { error: "Failed to fetch sermons" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sermons: sermons ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Sermons GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
