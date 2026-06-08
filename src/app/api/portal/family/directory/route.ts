import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/family/directory
 *
 * Lists all families by NAME + member count only (never the member identities)
 * so a signed-in member can pick one to join. Member details stay hidden until
 * they actually belong to the family.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: families, error } = await admin
    .from("families")
    .select("id, name")
    .order("name");
  if (error) {
    console.error("[PORTAL] family directory error:", error);
    return NextResponse.json({ error: "Failed to load directory" }, { status: 500 });
  }

  const { data: counts } = await admin.from("family_members").select("family_id");
  const countByFamily = new Map<string, number>();
  for (const row of counts ?? []) {
    countByFamily.set(row.family_id, (countByFamily.get(row.family_id) ?? 0) + 1);
  }

  // Which ones the user already belongs to (so the UI can mark them).
  const { data: mine } = await admin
    .from("family_members")
    .select("family_id")
    .eq("profile_id", user.id);
  const mineSet = new Set((mine ?? []).map((m) => m.family_id));

  const result = (families ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    member_count: countByFamily.get(f.id) ?? 0,
    joined: mineSet.has(f.id),
  }));

  return NextResponse.json({ families: result });
}
