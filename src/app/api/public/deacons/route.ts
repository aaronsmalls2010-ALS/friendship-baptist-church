import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/deacons
 *
 * Returns all active deacons with their profile and ward information.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: deacons, error } = await admin
      .from("deacons")
      .select("*, profiles(first_name, last_name, phone, photo_url), wards(name)")
      .eq("is_active", true);

    if (error) {
      console.error("[PUBLIC] Fetch deacons error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deacons" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deacons: deacons ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Deacons GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
