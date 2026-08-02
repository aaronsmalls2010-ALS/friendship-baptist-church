import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/events
 *
 * Returns upcoming published events, ordered by start_date ascending.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from("events")
      .select("*")
      .eq("is_published", true)
      .gt("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[PORTAL] Fetch events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Attach confirmed ('going') and waitlist counts so the UI can show spots remaining.
    const { data: rsvps } = await admin
      .from("event_rsvps")
      .select("event_id, status");

    const goingByEvent = new Map<string, number>();
    const waitlistByEvent = new Map<string, number>();
    for (const r of rsvps ?? []) {
      const map = r.status === "waitlist" ? waitlistByEvent : goingByEvent;
      map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1);
    }

    const enriched = (events ?? []).map((e) => ({
      ...e,
      going_count: goingByEvent.get(e.id) ?? 0,
      waitlist_count: waitlistByEvent.get(e.id) ?? 0,
    }));

    return NextResponse.json({ events: enriched });
  } catch (err) {
    console.error("[PORTAL] Events GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
