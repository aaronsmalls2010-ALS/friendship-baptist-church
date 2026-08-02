import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/** Relationship labels staff may assign to a household member. */
const RELATIONSHIP_OPTIONS = ["Head", "Spouse", "Child", "Other"] as const;
type Relationship = (typeof RELATIONSHIP_OPTIONS)[number];

function normalizeRelationship(value: unknown): Relationship | null {
  if (value == null || value === "") return null;
  const match = RELATIONSHIP_OPTIONS.find(
    (r) => r.toLowerCase() === value.toString().trim().toLowerCase()
  );
  return match ?? null;
}

/**
 * POST   /api/admin/families/[id]/members  — add a member { profile_id, relationship? }
 * PATCH  /api/admin/families/[id]/members  — update a member { profile_id, relationship?, is_head? }
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
  const relationship = normalizeRelationship(body?.relationship);

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

export async function PATCH(
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

  const hasRelationship = "relationship" in (body ?? {});
  const hasHead = "is_head" in (body ?? {});
  if (!hasRelationship && !hasHead) {
    return NextResponse.json(
      { error: "Provide relationship and/or is_head to update." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Setting a new head clears the flag on every other member of this family so
  // exactly one head-of-household is ever marked.
  if (hasHead && Boolean(body.is_head)) {
    const { error: clearErr } = await admin
      .from("family_members")
      .update({ is_head: false })
      .eq("family_id", familyId)
      .neq("profile_id", profileId);
    if (clearErr) {
      console.error("[ADMIN] Clear head-of-household error:", clearErr);
      return NextResponse.json({ error: "Failed to update head of household" }, { status: 500 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (hasRelationship) updates.relationship = normalizeRelationship(body.relationship);
  if (hasHead) updates.is_head = Boolean(body.is_head);

  const { error } = await admin
    .from("family_members")
    .update(updates)
    .eq("family_id", familyId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("[ADMIN] Update family member error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
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
