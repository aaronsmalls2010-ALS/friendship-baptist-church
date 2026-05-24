import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/dashboard
 *
 * Returns aggregated dashboard data for the authenticated user:
 * - events: next 3 upcoming events
 * - giving: { year_to_date, last_donation }
 * - announcements: latest 3 active announcements
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
    const now = new Date().toISOString();

    // Fetch next 3 upcoming events (admin client)
    const { data: events, error: eventsError } = await admin
      .from("events")
      .select("*")
      .eq("is_published", true)
      .gt("start_date", now)
      .order("start_date", { ascending: true })
      .limit(3);

    if (eventsError) {
      console.error("[PORTAL] Dashboard fetch events error:", eventsError);
    }

    // Fetch latest 3 active announcements (admin client)
    const { data: announcements, error: announcementsError } = await admin
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false })
      .limit(3);

    if (announcementsError) {
      console.error("[PORTAL] Dashboard fetch announcements error:", announcementsError);
    }

    // Fetch user's donations this year (user's supabase client for RLS)
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();

    const { data: yearDonations, error: donationsError } = await supabase
      .from("donations")
      .select("amount, created_at")
      .eq("profile_id", user.id)
      .gte("created_at", startOfYear)
      .order("created_at", { ascending: false });

    if (donationsError) {
      console.error("[PORTAL] Dashboard fetch donations error:", donationsError);
    }

    const yearToDate = (yearDonations ?? []).reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );
    const lastDonation = yearDonations?.[0] ?? null;

    return NextResponse.json({
      events: events ?? [],
      giving: {
        year_to_date: yearToDate,
        last_donation: lastDonation,
      },
      announcements: announcements ?? [],
    });
  } catch (err) {
    console.error("[PORTAL] Dashboard GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
