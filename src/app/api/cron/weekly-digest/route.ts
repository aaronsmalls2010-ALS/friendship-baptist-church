import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { expandOccurrences } from "@/lib/events/recurrence";
import { notifyCongregation } from "@/lib/push/notify";
import { isPushConfigured } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/weekly-digest
 *
 * "This week at Friendship Baptist" — one notification listing the published
 * events in the next seven days. Scheduled from vercel.json; Vercel signs the
 * call with CRON_SECRET, which is the only way in.
 *
 * Silent when there is nothing on the calendar: an empty digest is worse than
 * no digest.
 */

const CHURCH_TZ = "America/New_York";
const MAX_LISTED = 4;

type EventRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  recurrence: string | null;
  recurrence_end: string | null;
  is_published: boolean;
  is_birthday: boolean;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: CHURCH_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ skipped: "Push notifications are not configured." });
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Pull anything that could still be recurring into the window, then let
    // expandOccurrences decide which instances actually land in it.
    const { data, error } = await admin
      .from("events")
      .select(
        "id, title, start_date, end_date, recurrence, recurrence_end, is_published, is_birthday"
      )
      .eq("is_published", true)
      .eq("is_birthday", false)
      .lte("start_date", windowEnd.toISOString());

    if (error) {
      console.error("[CRON] weekly-digest load events error:", error);
      return NextResponse.json({ error: "Could not load events" }, { status: 500 });
    }

    const occurrences = (data ?? [])
      .flatMap((e) => expandOccurrences(e as EventRow, now, windowEnd, 20))
      .sort(
        (a, b) =>
          new Date(a.occurrence_start).getTime() -
          new Date(b.occurrence_start).getTime()
      );

    if (occurrences.length === 0) {
      console.log("[CRON] weekly-digest: nothing on the calendar, skipping.");
      return NextResponse.json({ sent: 0, events: 0, skipped: "No events this week." });
    }

    const listed = occurrences
      .slice(0, MAX_LISTED)
      .map((o) => `${o.title} (${formatWhen(o.occurrence_start)})`);
    const remaining = occurrences.length - listed.length;

    const body =
      listed.join(" · ") + (remaining > 0 ? ` · and ${remaining} more` : "");

    const result = await notifyCongregation({
      topic: "digest",
      title:
        occurrences.length === 1
          ? "This week at Friendship Baptist"
          : `This week at Friendship Baptist — ${occurrences.length} events`,
      body,
      url: "/events",
      tag: "weekly-digest",
    });

    console.log("[CRON] weekly-digest sent", {
      events: occurrences.length,
      devices: result.sent,
      inApp: result.inApp,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ events: occurrences.length, ...result });
  } catch (err) {
    console.error("[CRON] weekly-digest error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
