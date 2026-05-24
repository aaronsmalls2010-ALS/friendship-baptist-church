import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/businesses
 *
 * Returns all approved businesses, ordered by name.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: businesses, error } = await admin
      .from("businesses")
      .select("*")
      .eq("is_approved", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[PUBLIC] Fetch businesses error:", error);
      return NextResponse.json(
        { error: "Failed to fetch businesses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ businesses: businesses ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Businesses GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
