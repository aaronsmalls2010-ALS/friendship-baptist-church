import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

      const { data: events, error } = await admin
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("start_date", now.toISOString())
        .lte("start_date", in28Days.toISOString())
        .or("is_birthday.is.null,is_birthday.eq.false")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("[PUBLIC] Fetch upcoming events error:", error);
        return NextResponse.json(
          { error: "Failed to fetch events" },
          { status: 500 }
        );
      }

      return NextResponse.json({ events: events ?? [] });
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
