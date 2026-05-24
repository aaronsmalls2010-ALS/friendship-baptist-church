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
    const { data: rawDeacons, error } = await admin
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

    // Flatten: use standalone columns if present, fall back to profile join
    const deacons = (rawDeacons ?? []).map((d: Record<string, unknown>) => {
      const profile = d.profiles as Record<string, unknown> | null;
      const ward = d.wards as Record<string, unknown> | null;
      return {
        id: d.id,
        profile_id: d.profile_id,
        ward_id: d.ward_id,
        ordained_date: d.ordained_date,
        bio: d.bio,
        title: d.title,
        is_active: d.is_active,
        created_at: d.created_at,
        first_name: d.first_name || profile?.first_name || "",
        last_name: d.last_name || profile?.last_name || "",
        phone: d.phone || profile?.phone || null,
        photo_url: profile?.photo_url || null,
        ward_name: ward?.name || null,
      };
    });

    return NextResponse.json({ deacons });
  } catch (err) {
    console.error("[PUBLIC] Deacons GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
