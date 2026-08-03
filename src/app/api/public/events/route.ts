import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { expandOccurrences } from "@/lib/events/recurrence";

/**
 * GET /api/public/events
 *
 * Default: returns all published events, ordered by start_date descending.
 *
 * ?window=upcoming: returns only published, non-birthday events starting
 * between now and 28 days out, ordered by start_date ascending.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const upcoming =
      request.nextUrl.searchParams.get("window") === "upcoming";

    if (upcoming) {
      const now = new Date();
      const in28Days = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

      // Fetch candidates: any published non-birthday event whose (base) start is
      // on or before the window end. Recurring events that began earlier are
      // included so their upcoming occurrences can be expanded; past one-offs
      // simply expand to nothing.
      const { data: events, error } = await admin
        .from("events")
        .select("*")
        .eq("is_published", true)
        .lte("start_date", in28Days.toISOString())
        .or("is_birthday.is.null,is_birthday.eq.false");

      if (error) {
        console.error("[PUBLIC] Fetch upcoming events error:", error);
        return NextResponse.json(
          { error: "Failed to fetch events" },
          { status: 500 }
        );
      }

      // Expand recurring events into concrete occurrences within [now, +28d],
      // present each occurrence as a normal event (start_date = occurrence date).
      const occurrences = (events ?? [])
        .flatMap((e) => expandOccurrences(e, now, in28Days))
        .map((o) => ({
          ...o,
          start_date: o.occurrence_start,
          end_date: o.occurrence_end ?? o.end_date,
        }))
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 40);

      return NextResponse.json({ events: occurrences });
    }

    const { data: events, error } = await admin
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Events GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
