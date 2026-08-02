import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * GET  /api/admin/families  — list every family with its members.
 * POST /api/admin/families  — create a family (admin only).
 */

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();

  const { data: families, error } = await admin
    .from("families")
    .select("id, name, created_at")
    .order("name");
  if (error) {
    console.error("[ADMIN] Fetch families error:", error);
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 });
  }

  const { data: memberRows } = await admin
    .from("family_members")
    .select(
      "family_id, profile_id, relationship, is_head, profiles(first_name, last_name, email, photo_url)"
    );

  const membersByFamily = new Map<string, unknown[]>();
  for (const row of memberRows ?? []) {
    const list = membersByFamily.get(row.family_id) ?? [];
    list.push(row);
    membersByFamily.set(row.family_id, list);
  }

  const result = (families ?? []).map((f) => ({
    ...f,
    members: membersByFamily.get(f.id) ?? [],
  }));

  return NextResponse.json({ families: result });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const name = (body?.name ?? "").toString().trim();
  if (!name) {
    return NextResponse.json({ error: "Family name is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: family, error } = await admin
    .from("families")
    .insert({ name: name.slice(0, 120), created_by: auth.user.id })
    .select("id, name, created_at")
    .single();

  if (error) {
    console.error("[ADMIN] Create family error:", error);
    return NextResponse.json({ error: "Failed to create family" }, { status: 500 });
  }

  console.log("[AUDIT] family.create", {
    familyId: family.id,
    createdBy: auth.user.id,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ family: { ...family, members: [] } }, { status: 201 });
}
