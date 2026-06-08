import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/portal/family/leave  { family_id }
 *
 * A member removes THEMSELVES from a family.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const familyId = (body?.family_id ?? "").toString();
  if (!familyId) {
    return NextResponse.json({ error: "family_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("[PORTAL] family leave error:", error);
    return NextResponse.json({ error: "Failed to leave family" }, { status: 500 });
  }

  console.log("[AUDIT] family.self_leave", {
    familyId,
    profileId: user.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
