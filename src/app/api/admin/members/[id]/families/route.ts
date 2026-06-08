import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * PUT /api/admin/members/[id]/families
 * Body: { family_ids: string[] } — sets the member's COMPLETE set of families.
 * Admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: profileId } = await params;
  const body = await request.json().catch(() => ({}));
  const desired: string[] = Array.isArray(body?.family_ids)
    ? Array.from(new Set(body.family_ids.filter((v: unknown) => typeof v === "string")))
    : [];

  const admin = createAdminClient();

  const { data: currentRows, error: curErr } = await admin
    .from("family_members")
    .select("family_id")
    .eq("profile_id", profileId);
  if (curErr) {
    console.error("[ADMIN] member families read error:", curErr);
    return NextResponse.json({ error: "Failed to read families." }, { status: 500 });
  }
  const current = (currentRows ?? []).map((r) => r.family_id);

  const toAdd = desired.filter((f) => !current.includes(f));
  const toRemove = current.filter((f) => !desired.includes(f));

  if (toRemove.length) {
    const { error } = await admin
      .from("family_members")
      .delete()
      .eq("profile_id", profileId)
      .in("family_id", toRemove);
    if (error) {
      console.error("[ADMIN] member families remove error:", error);
      return NextResponse.json({ error: "Failed to update families." }, { status: 500 });
    }
  }
  if (toAdd.length) {
    const { error } = await admin
      .from("family_members")
      .insert(toAdd.map((family_id) => ({ family_id, profile_id: profileId })));
    if (error) {
      console.error("[ADMIN] member families add error:", error);
      return NextResponse.json({ error: "Failed to update families." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, family_ids: desired });
}
