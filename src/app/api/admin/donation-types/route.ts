import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export async function GET() {
  // Any admin can read types (needed to populate dropdowns)
  const { requireAdmin } = await import("@/lib/auth/require-admin");
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("donation_types")
    .select("*")
    .order("sort_order");

  if (error) return NextResponse.json({ error: "Failed to fetch types" }, { status: 500 });
  return NextResponse.json({ types: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, sort_order } = body;
  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = String(name).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const admin = createAdminClient();
  const { data, error } = await admin.from("donation_types").insert({
    name: String(name).trim(),
    slug,
    description: description ?? null,
    sort_order: sort_order ?? 99,
    is_active: true,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Failed to create type" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "donation_type.create",
    userId: auth.user.id,
    resourceType: "donation_type",
    resourceId: data.id,
    metadata: { name, slug },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
