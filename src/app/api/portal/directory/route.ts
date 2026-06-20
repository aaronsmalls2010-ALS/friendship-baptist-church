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
      ministries: { id: string; name: string } | { id: string; name: string }[] | null;
    }> = [];

    if (profileIds.length > 0) {
      const { data: membershipData, error: membershipsError } = await admin
        .from("ministry_members")
        .select("profile_id, ministries(id, name)")
        .in("profile_id", profileIds)
        .eq("status", "approved");

      if (membershipsError) {
        console.error("[PORTAL] Fetch directory memberships error:", membershipsError);
        // Non-fatal: continue without ministry data
      } else {
        memberships = (membershipData as typeof memberships) ?? [];
      }
    }

    // Build a map of profile_id -> ministry objects {id, name}
    const ministryMap = new Map<string, { ministry_id: string; name: string }[]>();
    const allMinistries = new Map<string, string>();

    for (const m of memberships) {
      const list = ministryMap.get(m.profile_id) ?? [];
      if (m.ministries) {
        const items = Array.isArray(m.ministries) ? m.ministries : [m.ministries];
        for (const min of items) {
          if (min.name) {
            list.push({ ministry_id: min.id ?? "", name: min.name });
            if (min.id) allMinistries.set(min.id, min.name);
          }
        }
      }
      ministryMap.set(m.profile_id, list);
    }

    // Merge ministry objects into profiles
    const directory = (profiles ?? []).map((profile) => ({
      ...profile,
      ministries: ministryMap.get(profile.id) ?? [],
    }));

    // Return distinct ministries list for filter dropdown
    const ministriesList = Array.from(allMinistries.entries()).map(([id, name]) => ({ id, name }));

    return NextResponse.json({ directory, ministries: ministriesList });
  } catch (err) {
    console.error("[PORTAL] Directory GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
