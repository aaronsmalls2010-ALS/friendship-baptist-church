import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: [] });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("saved_devotionals")
    .select("devotional_id, saved_at, devotionals(id, title, content, scripture, scripture_text, category, author)")
    .eq("profile_id", user.id)
    .order("saved_at", { ascending: false });

  if (error) return NextResponse.json({ saved: [] });
  return NextResponse.json({ saved: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { devotional_id } = body;
  if (!devotional_id) return NextResponse.json({ error: "devotional_id required" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("saved_devotionals").upsert(
    { profile_id: user.id, devotional_id },
    { onConflict: "profile_id,devotional_id" }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const devotional_id = searchParams.get("devotional_id");
  if (!devotional_id) return NextResponse.json({ error: "devotional_id required" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("saved_devotionals")
    .delete()
    .eq("profile_id", user.id)
    .eq("devotional_id", devotional_id);

  return NextResponse.json({ ok: true });
}
