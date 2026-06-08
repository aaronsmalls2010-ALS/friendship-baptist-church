import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/family
 *
 * Returns every family the authenticated member belongs to, each with its
 * members. Members can belong to multiple families.
 *
 * (Creating a family is admin-only now — see /api/admin/families. The old
 * self-service POST has been retired; members JOIN existing families instead.)
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

    // Families this user belongs to.
    const { data: mine, error: mineErr } = await admin
      .from("family_members")
      .select("family_id, relationship, families(id, name)")
      .eq("profile_id", user.id);
    if (mineErr) {
      console.error("[PORTAL] family memberships error:", mineErr);
      return NextResponse.json({ error: "Failed to load families" }, { status: 500 });
    }

    const familyIds = (mine ?? []).map((m) => m.family_id);
    if (!familyIds.length) {
      return NextResponse.json({ families: [] });
    }

    // All members of those families.
    const { data: memberRows } = await admin
      .from("family_members")
      .select(
        "family_id, profile_id, relationship, profiles(first_name, last_name, photo_url)"
      )
      .in("family_id", familyIds);

    const byFamily = new Map<string, unknown[]>();
    for (const row of memberRows ?? []) {
      const list = byFamily.get(row.family_id) ?? [];
      list.push(row);
      byFamily.set(row.family_id, list);
    }

    const families = (mine ?? []).map((m) => {
      const fam = m.families as unknown as { id: string; name: string } | null;
      return {
        id: m.family_id,
        name: fam?.name ?? "Family",
        relationship: m.relationship ?? null,
        members: byFamily.get(m.family_id) ?? [],
      };
    });

    return NextResponse.json({ families });
  } catch (err) {
    console.error("[PORTAL] Family GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
