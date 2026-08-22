import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { notifyCongregation } from "@/lib/push/notify";

// notifyCongregation reaches web-push, which needs the Node runtime.
export const runtime = "nodejs";

type EventRow = {
  title: string;
  start_date: string;
  location: string | null;
};

/**
 * Push + in-app notify the congregation about an event. Gated by each member's
 * `notify_events` preference. Never throws into the caller.
 */
async function notifyAboutEvent(event: EventRow) {
  try {
    const when = new Date(event.start_date).toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const body = event.location ? `${when} — ${event.location}` : when;

    const result = await notifyCongregation({
      topic: "event",
      title: event.title,
      body,
      url: "/events",
      tag: "event",
    });
    return { sent: result.sent, inApp: result.inApp, note: result.note };
  } catch (err) {
    console.error("[ADMIN] Event notify error:", err);
    return { sent: 0, inApp: 0, note: "Notification failed to send." };
  }
}

/**
 * GET /api/admin/events
 *
 * Fetches all events ordered by start_date desc.
 * Requires admin or super_admin role.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from("events")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Attach current RSVP counts (going / waitlist) per event for the list view.
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
    console.error("[ADMIN] Events GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/events
 *
 * Creates a new event.
 * Requires admin or super_admin role.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { title, description, start_date, end_date, location, ministry_id, is_published, rsvp_enabled, capacity, allow_waitlist, image_url, recurrence, recurrence_end, notify } = body;

    if (!title || !start_date) {
      return NextResponse.json(
        { error: "Missing required fields: title, start_date" },
        { status: 400 }
      );
    }

    // Normalize capacity: null (unlimited) or a positive integer.
    const capNum = Number(capacity);
    const normalizedCapacity =
      capacity === null || capacity === undefined || capacity === "" || !Number.isFinite(capNum) || capNum <= 0
        ? null
        : Math.floor(capNum);

    const admin = createAdminClient();
    const { data: event, error } = await admin
      .from("events")
      .insert({
        title,
        description,
        start_date,
        end_date,
        location,
        ministry_id,
        is_published,
        rsvp_enabled,
        capacity: normalizedCapacity,
        allow_waitlist: allow_waitlist === true,
        image_url,
        recurrence: recurrence || "none",
        recurrence_end: recurrence_end || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create event error:", error);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    // Only notify when the admin explicitly ticked the box, and never for a
    // draft — an unpublished event has nothing for a member to open.
    const notification =
      notify === true && event.is_published ? await notifyAboutEvent(event) : null;

    return NextResponse.json({ event, notification }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Events POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/events
 *
 * Updates an existing event.
 * Requires admin or super_admin role.
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...raw } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const allowed = ["title", "description", "start_date", "end_date", "location", "ministry_id", "is_published", "rsvp_enabled", "capacity", "allow_waitlist", "image_url", "recurrence", "recurrence_end"];
    const fields: Record<string, unknown> = {};
    for (const k of allowed) { if (k in raw) fields[k] = raw[k]; }

    // Normalize capacity: null (unlimited) or a positive integer.
    if ("capacity" in fields) {
      const capNum = Number(fields.capacity);
      fields.capacity =
        fields.capacity === null || fields.capacity === "" || !Number.isFinite(capNum) || capNum <= 0
          ? null
          : Math.floor(capNum);
    }
    if ("allow_waitlist" in fields) {
      fields.allow_waitlist = fields.allow_waitlist === true;
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("events")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: event, error } = await admin
      .from("events")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update event error:", error);
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }

    const notification =
      raw.notify === true && event.is_published ? await notifyAboutEvent(event) : null;

    return NextResponse.json({ event, notification });
  } catch (err) {
    console.error("[ADMIN] Events PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/events
 *
 * Deletes an event.
 * Requires admin or super_admin role.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("events")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { error } = await admin.from("events").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete event error:", error);
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Events DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
