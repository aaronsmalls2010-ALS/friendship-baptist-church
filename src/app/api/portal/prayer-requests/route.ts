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
    .select("id, name, request, is_public, status, category, created_at, profile_id, prayed_count")
    .or(`profile_id.eq.${user.id},is_public.eq.true`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ requests: [] });

  // Annotate each request with whether the caller has already prayed for it.
  const { data: prayedRows } = await admin
    .from("prayer_prayed")
    .select("request_id")
    .eq("profile_id", user.id);
  const prayedSet = new Set((prayedRows ?? []).map((r) => r.request_id));

  const requests = (data ?? []).map((r) => ({
    ...r,
    has_prayed: prayedSet.has(r.id),
  }));

  return NextResponse.json({ requests });
}

/**
 * PATCH /api/portal/prayer-requests
 * Body: { id: string, status: "answered" }
 * Lets the ORIGINAL AUTHOR mark their own request answered. The update is
 * scoped to `profile_id = user.id`, so a caller can never change someone
 * else's request.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = (body.id ?? "").toString();
  const status = (body.status ?? "").toString();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (status !== "answered") {
    return NextResponse.json({ error: "Only 'answered' is allowed" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Author-only: the profile_id filter guarantees the row belongs to the caller.
  const { data: updated, error } = await admin
    .from("prayer_requests")
    .update({ status: "answered" })
    .eq("id", id)
    .eq("profile_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[PORTAL] Prayer request PATCH error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
  if (!updated) {
    // Either the request doesn't exist or it isn't the caller's — same response.
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, status: "answered" });
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

  const safeName = String(name).trim().slice(0, 200);
  const safeRequest = String(prayerRequest).trim().slice(0, 5000);
  const safeCategory = category ? String(category).trim().slice(0, 100) : null;
  if (!safeName || !safeRequest)
    return NextResponse.json({ error: "name and request are required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("prayer_requests").insert({
    profile_id: user.id,
    name: safeName,
    request: safeRequest,
    is_public: Boolean(is_public),
    category: safeCategory,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Failed to submit prayer request" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
