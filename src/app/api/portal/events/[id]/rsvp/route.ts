import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const MAX_GUESTS = 10;

export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: eventId } = await params;
  const admin = createAdminClient();

  // Parse optional guest count from the body (defaults to 0, capped at MAX_GUESTS).
  let guests = 0;
  try {
    const body = await request.json();
    const g = Number(body?.guests);
    if (Number.isFinite(g) && g > 0) guests = Math.min(Math.floor(g), MAX_GUESTS);
  } catch {
    // No body / invalid JSON — treat as zero guests.
  }

  // Load the event's capacity settings.
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("capacity, allow_waitlist, rsvp_enabled")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (!event.rsvp_enabled) {
    return NextResponse.json({ error: "RSVP is not enabled for this event" }, { status: 400 });
  }

  // If the member already has an RSVP, keep their existing status when re-submitting
  // (e.g. only updating guest count). This preserves an already-going seat.
  const { data: existing } = await admin
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();

  let status: "going" | "waitlist" = "going";

  if (existing) {
    status = (existing.status as "going" | "waitlist") ?? "going";
  } else if (event.capacity != null) {
    // Count current confirmed ('going') RSVP rows (headcount = one row each — kept simple).
    const { count: goingCount } = await admin
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going");

    const full = (goingCount ?? 0) >= event.capacity;
    if (full) {
      if (event.allow_waitlist) {
        status = "waitlist";
      } else {
        return NextResponse.json(
          { error: "This event is full.", full: true },
          { status: 409 }
        );
      }
    }
  }

  const { error } = await admin.from("event_rsvps").upsert(
    {
      event_id: eventId,
      profile_id: user.id,
      status,
      guests,
      created_at: existing ? undefined : new Date().toISOString(),
    },
    { onConflict: "event_id,profile_id" }
  );

  if (error) return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  return NextResponse.json({ ok: true, status, guests });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: eventId } = await params;
  const admin = createAdminClient();

  // Capture the member's status before deleting so we know whether a seat frees up.
  const { data: leaving } = await admin
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();

  const { error } = await admin.from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to cancel RSVP" }, { status: 500 });

  // Promotion: if a confirmed seat was vacated, promote the oldest waitlisted RSVP.
  if (leaving?.status === "going") {
    const { data: event } = await admin
      .from("events")
      .select("capacity")
      .eq("id", eventId)
      .maybeSingle();

    // Only promote when the event has a capacity limit and now has room.
    if (event?.capacity != null) {
      const { count: goingCount } = await admin
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "going");

      if ((goingCount ?? 0) < event.capacity) {
        const { data: nextUp } = await admin
          .from("event_rsvps")
          .select("profile_id")
          .eq("event_id", eventId)
          .eq("status", "waitlist")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextUp) {
          await admin
            .from("event_rsvps")
            .update({ status: "going" })
            .eq("event_id", eventId)
            .eq("profile_id", nextUp.profile_id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ rsvped: false });

  const { id: eventId } = await params;
  const admin = createAdminClient();

  const { data } = await admin.from("event_rsvps")
    .select("event_id, status, guests")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    rsvped: !!data,
    status: data?.status ?? null,
    guests: data?.guests ?? 0,
  });
}
