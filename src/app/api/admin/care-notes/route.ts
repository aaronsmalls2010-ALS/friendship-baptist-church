import { NextRequest, NextResponse } from "next/server";
import { requireCareAccess } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireCareAccess();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profile_id");
  if (!profileId) return NextResponse.json({ error: "profile_id required" }, { status: 400 });

  // Use RLS-aware client so policies are enforced
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("care_notes")
    .select("*, profiles!author_id(first_name, last_name)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireCareAccess();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { profile_id, body: noteBody } = body;
  if (!profile_id || !noteBody) return NextResponse.json({ error: "profile_id and body are required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("care_notes").insert({
    profile_id,
    author_id: auth.user.id,
    body: noteBody,
  });

  if (error) return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCareAccess();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("care_notes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
