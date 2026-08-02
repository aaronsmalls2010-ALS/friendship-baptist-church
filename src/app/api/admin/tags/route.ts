import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

/**
 * GET /api/admin/tags
 *
 * Returns all tags with a member count (from profile_tags) for each.
 * Requires admin or super_admin.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data: tags, error } = await admin
    .from("tags")
    .select("id, name, color, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("[ADMIN] Fetch tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }

  // One bulk query for membership, then count per tag in memory.
  const { data: links } = await admin.from("profile_tags").select("tag_id");
  const counts = new Map<string, number>();
  for (const row of links ?? []) {
    counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1);
  }

  const withCounts = (tags ?? []).map((t) => ({
    ...t,
    member_count: counts.get(t.id) ?? 0,
  }));

  return NextResponse.json({ tags: withCounts });
}

/**
 * POST /api/admin/tags
 *
 * Creates a new tag { name, color }. `name` is UNIQUE in the DB.
 * Requires admin or super_admin.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, color } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tags")
    .insert({
      name: String(name).trim().slice(0, 100),
      color: color && typeof color === "string" ? String(color).trim().slice(0, 32) : null,
    })
    .select("id, name, color, created_at")
    .single();

  if (error) {
    // Unique-violation on name → friendly 409.
    if (error.code === "23505") {
      return NextResponse.json({ error: "A tag with that name already exists" }, { status: 409 });
    }
    console.error("[ADMIN] Create tag error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "tag.create", name: data.name },
    userId: auth.user.id,
    resourceType: "tag",
    resourceId: data.id,
    ip,
    userAgent,
  });

  return NextResponse.json({ tag: { ...data, member_count: 0 } }, { status: 201 });
}
