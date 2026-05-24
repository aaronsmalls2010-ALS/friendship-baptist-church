import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/testimonies
 *
 * Returns all approved testimonies, ordered by created_at descending.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: testimonies, error } = await admin
      .from("testimonies")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch testimonies error:", error);
      return NextResponse.json(
        { error: "Failed to fetch testimonies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ testimonies: testimonies ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Testimonies GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
