import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("memorials")
    .select("*, profiles(first_name, last_name), comments:memorial_comments(*)")
    .is("archived_at", null)
    .order("date_of_passing", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch memorials" }, { status: 500 });
  return NextResponse.json({ memorials: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { first_name, last_name, date_of_passing, obituary, photo_url, date_of_birth, is_published, scripture, scripture_text, favorite_hymn, church_roles, family_message } = body;
  if (!first_name || !last_name || !date_of_passing)
    return NextResponse.json({ error: "first_name, last_name, and date_of_passing are required" }, { status: 400 });

  const admin = createAdminClient();
  const insertData: Record<string, unknown> = {
    created_by: auth.user.id,
    first_name, last_name, date_of_passing,
    obituary: obituary ?? "",
  };
  if (photo_url !== undefined) insertData.photo_url = photo_url;
  if (date_of_birth !== undefined) insertData.date_of_birth = date_of_birth;
  if (is_published !== undefined) insertData.is_published = is_published;
  if (scripture !== undefined) insertData.scripture = scripture;
  if (scripture_text !== undefined) insertData.scripture_text = scripture_text;
  if (favorite_hymn !== undefined) insertData.favorite_hymn = favorite_hymn;
  if (church_roles !== undefined) insertData.church_roles = church_roles;
  if (family_message !== undefined) insertData.family_message = family_message;

  const { data, error } = await admin.from("memorials").insert(insertData).select("id").single();

  if (error) return NextResponse.json({ error: "Failed to create memorial" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({ type: "memorial.create", userId: auth.user.id, resourceType: "memorial", resourceId: data.id, ip, userAgent });

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
