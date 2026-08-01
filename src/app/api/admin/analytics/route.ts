import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/analytics
 *
 * Returns real per-event RSVP counts for the analytics dashboard.
 *
 * NOTE: There is no attendance-tracking data model in the schema. RSVPs are the
 * only real event-engagement signal we have (the event_rsvps table), so this
 * reports RSVP counts — NOT attendance. The UI labels them "RSVPs" accordingly.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("events")
    .select("id, title, start_date, event_rsvps(count)")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("[ADMIN] Analytics event RSVP error:", error);
    return NextResponse.json({ error: "Failed to load event RSVPs" }, { status: 500 });
  }

  const eventRsvps = (data ?? []).map((e) => {
    const rsvps = e.event_rsvps as unknown as { count: number }[] | null;
    return {
      id: e.id as string,
      title: e.title as string,
      start_date: e.start_date as string,
      rsvps: rsvps?.[0]?.count ?? 0,
    };
  });

  return NextResponse.json({ eventRsvps });
}
