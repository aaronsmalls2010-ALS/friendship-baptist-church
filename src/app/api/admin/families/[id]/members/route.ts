import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * POST   /api/admin/families/[id]/members  — add a member { profile_id, relationship? }
 * DELETE /api/admin/families/[id]/members  — remove a member { profile_id }
 * Admin only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: familyId } = await params;
  const body = await request.json().catch(() => ({}));
  const profileId = (body?.profile_id ?? "").toString();
  const relationship = body?.relationship
    ? body.relationship.toString().slice(0, 40)
    : null;

  if (!profileId) {
    return NextResponse.json({ error: "profile_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("family_members")
    .upsert(
      { family_id: familyId, profile_id: profileId, relationship },
      { onConflict: "family_id,profile_id" }
    );

  if (error) {
    console.error("[ADMIN] Add family member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: familyId } = await params;
  const body = await request.json().catch(() => ({}));
  const profileId = (body?.profile_id ?? "").toString();
  if (!profileId) {
    return NextResponse.json({ error: "profile_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("[ADMIN] Remove family member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
