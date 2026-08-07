"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Loader2,
  CalendarCheck,
  CalendarX,
  Users,
  Hourglass,
  AlertCircle,
} from "lucide-react";
import { EventsCalendar } from "@/components/events/events-calendar";
import type { Occurrence } from "@/lib/events/calendar";
import type { Event, Ministry } from "@/types";

type RsvpMeta = { status: "going" | "waitlist"; guests: number };

export default function MyEventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [birthdayEvents, setBirthdayEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
  const [rsvpMeta, setRsvpMeta] = useState<Map<string, RsvpMeta>>(new Map());
  const [guestSelect, setGuestSelect] = useState<Map<string, number>>(new Map());
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [rsvpToast, setRsvpToast] = useState<{
    text: string;
    tone: "success" | "error" | "waitlist";
  } | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Full published-event set (past + future) drives the mirrored calendar
        // and list; the portal endpoint supplies live RSVP counts/capacity; the
        // ministries feed labels the calendar categories.
        const [publicRes, portalRes, ministriesRes, birthdaysRes] =
          await Promise.all([
            fetch("/api/public/events"),
            fetch("/api/portal/events"),
            fetch("/api/public/ministries"),
            fetch("/api/portal/birthdays"),
          ]);

        const publicData = publicRes.ok ? await publicRes.json() : { events: [] };
        const portalData = portalRes.ok ? await portalRes.json() : { events: [] };
        const ministriesData = ministriesRes.ok
          ? await ministriesRes.json()
          : { ministries: [] };
        const birthdaysData = birthdaysRes.ok
          ? await birthdaysRes.json()
          : { birthdays: [] };

        setMinistries(ministriesData.ministries ?? []);

        // Merge live RSVP counts (going/waitlist) from the portal endpoint onto
        // the full public event list so the RSVP control can show spots left.
        const countsById = new Map<
          string,
          { going_count: number; waitlist_count: number }
        >();
        for (const e of portalData.events ?? []) {
          countsById.set(e.id, {
            going_count: e.going_count ?? 0,
            waitlist_count: e.waitlist_count ?? 0,
          });
        }
        const allEvents: Event[] = (publicData.events ?? []).map((e: Event) => ({
          ...e,
          ...(countsById.get(e.id) ?? {}),
        }));
        setEvents(allEvents);

        // Birthdays for the current and next year so calendar navigation across
        // a year boundary still shows them (mirrors the public Events page).
        const currentYear = new Date().getFullYear();
        const bdays: Event[] = (birthdaysData.birthdays ?? []).flatMap(
          (p: {
            id: string;
            first_name: string;
            last_name: string;
            date_of_birth: string;
          }) => {
            const dob = new Date(p.date_of_birth + "T12:00:00");
            return [currentYear, currentYear + 1].map((yr) => {
              const bdayDate = new Date(yr, dob.getMonth(), dob.getDate(), 12, 0, 0);
              return {
                id: `bday-${p.id}-${yr}`,
                title: `🎂 ${p.first_name} ${p.last_name}'s Birthday`,
                description: `Happy Birthday to ${p.first_name} ${p.last_name}! Wishing you many blessings.`,
                start_date: bdayDate.toISOString(),
                location: "",
                rsvp_enabled: false,
                is_published: true,
                created_at: new Date().toISOString(),
              } as Event;
            });
          }
        );
        setBirthdayEvents(bdays);

        // Hydrate the member's actual RSVP state for upcoming, RSVP-enabled events.
        const now = new Date();
        const rsvpTargets = allEvents.filter(
          (e) =>
            e.rsvp_enabled &&
            !e.id.startsWith("bday-") &&
            new Date(e.start_date) >= now
        );
        const rsvpResults = await Promise.all(
          rsvpTargets.map((e) =>
            fetch(`/api/portal/events/${e.id}/rsvp`)
              .then((r) => (r.ok ? r.json() : { rsvped: false }))
              .then((d) => ({
                id: e.id,
                rsvped: !!d.rsvped,
                status: (d.status as "going" | "waitlist") ?? "going",
                guests: Number(d.guests) || 0,
              }))
              .catch(() => ({
                id: e.id,
                rsvped: false,
                status: "going" as const,
                guests: 0,
              }))
          )
        );
        const rsvpedSet = new Set(
          rsvpResults.filter((r) => r.rsvped).map((r) => r.id)
        );
        setRsvpedIds(rsvpedSet);

        const metaMap = new Map<string, RsvpMeta>();
        for (const r of rsvpResults) {
          if (r.rsvped) metaMap.set(r.id, { status: r.status, guests: r.guests });
        }
        setRsvpMeta(metaMap);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  function showToast(text: string, tone: "success" | "error" | "waitlist") {
    setRsvpToast({ text, tone });
    setTimeout(() => setRsvpToast(null), 3000);
  }

  async function handleRsvp(eventId: string) {
    const isRsvped = rsvpedIds.has(eventId);
    setRsvpLoading(eventId);

    const res = await fetch(`/api/portal/events/${eventId}/rsvp`, {
      method: isRsvped ? "DELETE" : "POST",
      headers: isRsvped ? undefined : { "Content-Type": "application/json" },
      body: isRsvped
        ? undefined
        : JSON.stringify({ guests: guestSelect.get(eventId) ?? 0 }),
    });
    setRsvpLoading(null);

    if (isRsvped) {
      if (res.ok) {
        setRsvpedIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setRsvpMeta((prev) => {
          const next = new Map(prev);
          next.delete(eventId);
          return next;
        });
        showToast("RSVP cancelled", "success");
      }
      return;
    }

    // POST (new RSVP)
    const data = res.ok ? await res.json().catch(() => null) : null;
    if (res.ok && data?.ok) {
      const status: "going" | "waitlist" =
        data.status === "waitlist" ? "waitlist" : "going";
      setRsvpedIds((prev) => new Set(prev).add(eventId));
      setRsvpMeta((prev) => {
        const next = new Map(prev);
        next.set(eventId, { status, guests: Number(data.guests) || 0 });
        return next;
      });
      if (status === "waitlist") {
        showToast("Event full — you're on the waitlist", "waitlist");
      } else {
        showToast("You're registered!", "success");
      }
    } else if (res.status === 409) {
      showToast("This event is full.", "error");
    } else {
      showToast("Could not RSVP. Please try again.", "error");
    }
  }

  // Capacity / spots-remaining line for an event's meta row.
  function capacityLine(event: Occurrence) {
    if (!event.rsvp_enabled || event.capacity == null) return null;
    const going = event.going_count ?? 0;
    const remaining = Math.max(0, event.capacity - going);
    const full = remaining <= 0;
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-warm-500">
        <Users
          className={full ? "h-4 w-4 text-amber-500" : "h-4 w-4 text-purple-500"}
        />
        {full
          ? event.allow_waitlist
            ? "Full — waitlist open"
            : "Full"
          : `${remaining} of ${event.capacity} spot${event.capacity === 1 ? "" : "s"} left`}
      </span>
    );
  }

  // RSVP control: guest picker + action button, or the member's current status.
  function renderRsvpControl(event: Occurrence) {
    const meta = rsvpMeta.get(event.id);
    const isRsvped = rsvpedIds.has(event.id);
    const going = event.going_count ?? 0;
    const full = event.capacity != null && going >= event.capacity;
    const busy = rsvpLoading === event.id;

    if (isRsvped) {
      const waitlisted = meta?.status === "waitlist";
      return (
        <div className="mt-2 flex flex-col items-stretch gap-2 sm:max-w-xs">
          {capacityLine(event)}
          <Badge
            className={
              waitlisted
                ? "justify-center bg-amber-100 text-amber-700 hover:bg-amber-100"
                : "justify-center bg-green-100 text-green-700 hover:bg-green-100"
            }
          >
            {waitlisted ? (
              <>
                <Hourglass className="mr-1.5 h-3.5 w-3.5" />
                Waitlisted
              </>
            ) : (
              <>
                <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
                Going
              </>
            )}
          </Badge>
          {meta && meta.guests > 0 && (
            <span className="text-center text-xs text-warm-500">
              +{meta.guests} guest{meta.guests > 1 ? "s" : ""}
            </span>
          )}
          <Button
            variant="outline"
            className="border-warm-200 text-warm-600 hover:bg-red-50 hover:text-red-600"
            disabled={busy}
            onClick={() => handleRsvp(event.id)}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel RSVP"}
          </Button>
        </div>
      );
    }

    const canWaitlist = full && event.allow_waitlist;
    const blocked = full && !event.allow_waitlist;

    return (
      <div className="mt-2 flex flex-col items-stretch gap-2 sm:max-w-xs">
        {capacityLine(event)}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-warm-400" />
          <Select
            value={String(guestSelect.get(event.id) ?? 0)}
            onValueChange={(v) =>
              setGuestSelect((prev) => new Map(prev).set(event.id, Number(v)))
            }
          >
            <SelectTrigger className="h-9" aria-label="Number of guests">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 0 ? "Just me" : `+${n} guest${n > 1 ? "s" : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className={
            blocked
              ? "cursor-not-allowed bg-warm-200 text-warm-500"
              : canWaitlist
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-purple-700 text-white hover:bg-purple-600"
          }
          disabled={busy || blocked}
          onClick={() => handleRsvp(event.id)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : blocked ? (
            "Event Full"
          ) : canWaitlist ? (
            <>
              <Hourglass className="mr-2 h-4 w-4" />
              Join Waitlist
            </>
          ) : (
            <>
              <CalendarX className="mr-2 h-4 w-4" />
              RSVP
            </>
          )}
        </Button>
      </div>
    );
  }

  const rsvpCta = (event: Occurrence) =>
    event.rsvp_enabled ? renderRsvpControl(event) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      {rsvpToast && (
        <div
          role="alert"
          className={
            "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg border " +
            (rsvpToast.tone === "error"
              ? "bg-red-50 text-red-800 border-red-200"
              : rsvpToast.tone === "waitlist"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-green-50 text-green-800 border-green-200")
          }
        >
          {rsvpToast.tone === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : rsvpToast.tone === "waitlist" ? (
            <Hourglass className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 shrink-0" />
          )}
          {rsvpToast.text}
        </div>
      )}

      {/* Page Header */}
      <FadeIn>
        <div>
          <h1 className="font-heading text-fluid-3xl font-bold text-warm-900">
            Upcoming Events
          </h1>
          <p className="text-warm-500 mt-1">
            Everything happening at Friendship Baptist Church — RSVP right here.
          </p>
        </div>
      </FadeIn>

      <EventsCalendar
        events={events}
        birthdayEvents={birthdayEvents}
        ministries={ministries}
        featuredCta={rsvpCta}
        cardCta={rsvpCta}
        showPast={false}
        recurrenceHorizonDays={90}
      />
    </div>
  );
}
