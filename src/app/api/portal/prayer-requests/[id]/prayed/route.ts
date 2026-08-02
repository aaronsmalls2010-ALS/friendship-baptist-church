import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

/**
 * Recompute prayer_requests.prayed_count as the authoritative count of
 * prayer_prayed rows for a request, and return it.
 */
async function recomputeCount(
  admin: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<number> {
  const { count } = await admin
    .from("prayer_prayed")
    .select("request_id", { count: "exact", head: true })
    .eq("request_id", requestId);
  const total = count ?? 0;
  await admin
    .from("prayer_requests")
    .update({ prayed_count: total })
    .eq("id", requestId);
  return total;
}

/**
 * POST /api/portal/prayer-requests/[id]/prayed
 * Records that the caller prayed for this request (idempotent), then returns
 * the fresh count. A user can only ever create their OWN prayed row.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: requestId } = await params;
  const admin = createAdminClient();

  // Confirm the request exists (and is one the caller can see/pray for).
  const { data: pr } = await admin
    .from("prayer_requests")
    .select("id, is_public, profile_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!pr) return NextResponse.json({ error: "Prayer request not found" }, { status: 404 });
  if (!pr.is_public && pr.profile_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Insert the caller's own row; ignore duplicate (already prayed).
  const { error } = await admin
    .from("prayer_prayed")
    .upsert(
      { request_id: requestId, profile_id: user.id },
      { onConflict: "request_id,profile_id", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[PORTAL] Prayer prayed insert error:", error);
    return NextResponse.json({ error: "Failed to record prayer" }, { status: 500 });
  }

  const count = await recomputeCount(admin, requestId);
  return NextResponse.json({ prayed: true, count });
}

/**
 * DELETE /api/portal/prayer-requests/[id]/prayed
 * Removes the caller's own prayed row, then returns the fresh count.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: requestId } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("prayer_prayed")
    .delete()
    .eq("request_id", requestId)
    .eq("profile_id", user.id);
  if (error) {
    console.error("[PORTAL] Prayer prayed delete error:", error);
    return NextResponse.json({ error: "Failed to update prayer" }, { status: 500 });
  }

  const count = await recomputeCount(admin, requestId);
  return NextResponse.json({ prayed: false, count });
}
