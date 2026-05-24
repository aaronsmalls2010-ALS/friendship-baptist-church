import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/directory
 *
 * Returns profiles visible in the church directory along with their ministry memberships.
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

    // Fetch profiles that are public in the directory
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, first_name, last_name, phone, email, photo_url, role")
      .eq("public_directory", true);

    if (profilesError) {
      console.error("[PORTAL] Fetch directory profiles error:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch directory" },
        { status: 500 }
      );
    }

    // Fetch ministry memberships for all directory profiles
    const profileIds = (profiles ?? []).map((p) => p.id);

    let memberships: Array<{
      profile_id: string;
      ministries: { name: string } | { name: string }[] | null;
    }> = [];

    if (profileIds.length > 0) {
      const { data: membershipData, error: membershipsError } = await admin
        .from("ministry_members")
        .select("profile_id, ministries(name)")
        .in("profile_id", profileIds)
        .eq("status", "approved");

      if (membershipsError) {
        console.error("[PORTAL] Fetch directory memberships error:", membershipsError);
        // Non-fatal: continue without ministry data
      } else {
        memberships = (membershipData as typeof memberships) ?? [];
      }
    }

    // Build a map of profile_id -> ministry names
    const ministryMap = new Map<string, string[]>();
    for (const m of memberships) {
      const names = ministryMap.get(m.profile_id) ?? [];
      if (m.ministries) {
        if (Array.isArray(m.ministries)) {
          for (const min of m.ministries) {
            if (min.name) names.push(min.name);
          }
        } else if (m.ministries.name) {
          names.push(m.ministries.name);
        }
      }
      ministryMap.set(m.profile_id, names);
    }

    // Merge ministry names into profiles
    const directory = (profiles ?? []).map((profile) => ({
      ...profile,
      ministries: ministryMap.get(profile.id) ?? [],
    }));

    return NextResponse.json({ directory });
  } catch (err) {
    console.error("[PORTAL] Directory GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
