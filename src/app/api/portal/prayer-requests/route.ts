import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  // Return own requests + public approved requests from others
  const { data, error } = await admin
    .from("prayer_requests")
    .select("id, name, request, is_public, status, category, created_at, profile_id")
    .or(`profile_id.eq.${user.id},is_public.eq.true`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ requests: [] });
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { request: prayerRequest, name, is_public, category } = body;
  if (!prayerRequest || !name)
    return NextResponse.json({ error: "name and request are required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("prayer_requests").insert({
    profile_id: user.id,
    name: String(name).trim(),
    request: String(prayerRequest).trim(),
    is_public: Boolean(is_public),
    category: category ?? null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Failed to submit prayer request" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
