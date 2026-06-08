import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * PATCH  /api/admin/families/[id]  — rename a family (admin only).
 * DELETE /api/admin/families/[id]  — delete a family (cascades members).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = (body?.name ?? "").toString().trim();
  if (!name) {
    return NextResponse.json({ error: "Family name is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("families")
    .update({ name: name.slice(0, 120), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[ADMIN] Rename family error:", error);
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("families").delete().eq("id", id);

  if (error) {
    console.error("[ADMIN] Delete family error:", error);
    return NextResponse.json({ error: "Failed to delete family" }, { status: 500 });
  }

  console.log("[AUDIT] family.delete", {
    familyId: id,
    deletedBy: auth.user.id,
    timestamp: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}
