import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/portal/family/join  { family_id }
 *
 * Open self-join: a signed-in member adds THEMSELVES to an existing family.
 * Members can join multiple families. They can never create one (admin only).
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

  // Ensure the family exists.
  const { data: family } = await admin
    .from("families")
    .select("id, name")
    .eq("id", familyId)
    .maybeSingle();
  if (!family) {
    return NextResponse.json({ error: "That family no longer exists." }, { status: 404 });
  }

  // Add the caller as themselves (idempotent).
  const { error } = await admin
    .from("family_members")
    .upsert(
      { family_id: familyId, profile_id: user.id },
      { onConflict: "family_id,profile_id" }
    );
  if (error) {
    console.error("[PORTAL] family join error:", error);
    return NextResponse.json({ error: "Failed to join family" }, { status: 500 });
  }

  console.log("[AUDIT] family.self_join", {
    familyId,
    profileId: user.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, family });
}
