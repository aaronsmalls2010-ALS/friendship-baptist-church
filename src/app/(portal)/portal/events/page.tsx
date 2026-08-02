"use client";

import { useState, useEffect } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, MapPin, Clock, CheckCircle, Loader2, CalendarCheck, CalendarX, Cake, Users, Hourglass, AlertCircle } from "lucide-react";

type RsvpMeta = { status: "going" | "waitlist"; guests: number };

export default function MyEventsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registered");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
  const [rsvpMeta, setRsvpMeta] = useState<Map<string, RsvpMeta>>(new Map());
  const [guestSelect, setGuestSelect] = useState<Map<string, number>>(new Map());
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [rsvpToast, setRsvpToast] = useState<{ text: string; tone: "success" | "error" | "waitlist" } | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [eventsRes, birthdaysRes] = await Promise.all([
          fetch("/api/portal/events"),
          fetch("/api/portal/birthdays"),
        ]);

        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
        const birthdaysData = birthdaysRes.ok ? await birthdaysRes.json() : { birthdays: [] };

        const currentYear = new Date().getFullYear();
        const bdayEvents: any[] = (birthdaysData.birthdays ?? []).map(
          (p: { id: string; first_name: string; last_name: string; date_of_birth: string }) => {
            const dob = new Date(p.date_of_birth + "T12:00:00");
            const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate(), 12, 0, 0);
            return {
              id: `bday-${p.id}`,
              title: `${p.first_name} ${p.last_name}'s Birthday`,
              description: `Happy Birthday to ${p.first_name} ${p.last_name}! Wishing you many blessings.`,
              start_date: birthdayThisYear.toISOString(),
              location: "",
              rsvp_enabled: false,
              is_published: true,
              is_birthday: true,
              created_at: new Date().toISOString(),
            };
          }
        );

        const allEvents = [...(eventsData.events || []), ...bdayEvents];
        const now = new Date();

        const upcoming = allEvents
          .filter((e: any) => new Date(e.start_date) >= now)
          .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        const past = allEvents
          .filter((e: any) => new Date(e.start_date) < now)
          .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

        setUpcomingEvents(upcoming);
        setPastEvents(past);

        // Hydrate the member's actual RSVP state from the server
        const realEvents = allEvents.filter((e: any) => !e.id.startsWith("bday-"));
        const rsvpResults = await Promise.all(
          realEvents.map((e: any) =>
            fetch(`/api/portal/events/${e.id}/rsvp`)
              .then((r) => (r.ok ? r.json() : { rsvped: false }))
              .then((d) => ({
                id: e.id,
                rsvped: !!d.rsvped,
                status: (d.status as "going" | "waitlist") ?? "going",
                guests: Number(d.guests) || 0,
              }))
              .catch(() => ({ id: e.id, rsvped: false, status: "going" as const, guests: 0 }))
          )
        );
        const rsvpedSet = new Set(rsvpResults.filter((r) => r.rsvped).map((r) => r.id));
        setRsvpedIds(rsvpedSet);

        const metaMap = new Map<string, RsvpMeta>();
        for (const r of rsvpResults) {
          if (r.rsvped) metaMap.set(r.id, { status: r.status, guests: r.guests });
        }
        setRsvpMeta(metaMap);

        // Registered events: upcoming non-birthday events the member actually RSVP'd to
        const registeredNonBday = upcoming.filter(
          (e: any) => !e.id.startsWith("bday-") && rsvpedSet.has(e.id)
        );
        setRegisteredEvents(registeredNonBday);

        // Recommended events: ministry events not in registered
        const recommended = upcoming
          .filter(
            (e: any) =>
              e.ministry_id &&
              !e.id.startsWith("bday-") &&
              !registeredNonBday.some((r: any) => r.id === e.id)
          )
          .slice(0, 3);
        setRecommendedEvents(recommended);
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
      const status: "going" | "waitlist" = data.status === "waitlist" ? "waitlist" : "going";
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
  function capacityLine(event: any) {
    if (!event.rsvp_enabled || event.capacity == null) return null;
    const going = event.going_count ?? 0;
    const remaining = Math.max(0, event.capacity - going);
    const full = remaining <= 0;
    return (
      <span className="inline-flex items-center gap-1.5">
        <Users className={full ? "h-4 w-4 text-amber-500" : "h-4 w-4 text-purple-500"} />
        {full
          ? event.allow_waitlist
            ? "Full — waitlist open"
            : "Full"
          : `${remaining} of ${event.capacity} spot${event.capacity === 1 ? "" : "s"} left`}
      </span>
    );
  }

  // RSVP control: guest picker + action button, or the member's current status.
  function renderRsvpControl(event: any, idleClassName: string) {
    const meta = rsvpMeta.get(event.id);
    const isRsvped = rsvpedIds.has(event.id);
    const going = event.going_count ?? 0;
    const full = event.capacity != null && going >= event.capacity;
    const busy = rsvpLoading === event.id;

    if (isRsvped) {
      const waitlisted = meta?.status === "waitlist";
      return (
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-44">
          <Badge
            className={
              waitlisted
                ? "justify-center bg-amber-100 text-amber-700 hover:bg-amber-100"
                : "justify-center bg-green-100 text-green-700 hover:bg-green-100"
            }
          >
            {waitlisted ? (
              <><Hourglass className="mr-1.5 h-3.5 w-3.5" />Waitlisted</>
            ) : (
              <><CalendarCheck className="mr-1.5 h-3.5 w-3.5" />Going</>
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
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-44">
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
              ? "shrink-0 cursor-not-allowed bg-warm-200 text-warm-500"
              : canWaitlist
                ? "shrink-0 bg-amber-500 text-white hover:bg-amber-600"
                : idleClassName
          }
          disabled={busy || blocked}
          onClick={() => handleRsvp(event.id)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : blocked ? (
            "Event Full"
          ) : canWaitlist ? (
            <><Hourglass className="mr-2 h-4 w-4" />Join Waitlist</>
          ) : (
            <><CalendarX className="mr-2 h-4 w-4" />RSVP</>
          )}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            My Events
          </h1>
          <p className="text-warm-500 mt-1">
            Events you&apos;ve registered for and upcoming opportunities
          </p>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-warm-100">
            <TabsTrigger value="registered">Registered</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Registered Tab */}
          <TabsContent value="registered" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              {registeredEvents.map((event, index) => (
                <FadeIn key={event.id} delay={index * 0.1}>
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <h3 className="font-heading text-xl font-semibold text-warm-900">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-warm-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-purple-500" />
                            {formatDate(event.start_date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-purple-500" />
                            {formatTime(event.start_date)}
                            {event.end_date &&
                              ` – ${formatTime(event.end_date)}`}
                          </span>
                          {event.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-purple-500" />
                              {event.location}
                            </span>
                          )}
                          {capacityLine(event)}
                        </div>
                        <p className="text-warm-600 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                      {renderRsvpControl(event, "shrink-0 bg-purple-700 hover:bg-purple-600 text-white")}
                    </div>
                  </div>
                </FadeIn>
              ))}
              {registeredEvents.length === 0 && (
                <p className="text-center text-warm-500 py-12">
                  You haven&apos;t registered for any upcoming events yet.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Recommended Tab */}
          <TabsContent value="recommended" className="mt-6">
            <p className="text-sm text-warm-500 mb-6">
              Recommended based on your ministries
            </p>
            <div className="grid grid-cols-1 gap-6">
              {recommendedEvents.map((event, index) => (
                <FadeIn key={event.id} delay={index * 0.1}>
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-purple-400">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <h3 className="font-heading text-xl font-semibold text-warm-900">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-warm-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-purple-500" />
                            {formatDate(event.start_date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-purple-500" />
                            {formatTime(event.start_date)}
                            {event.end_date &&
                              ` – ${formatTime(event.end_date)}`}
                          </span>
                          {event.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-purple-500" />
                              {event.location}
                            </span>
                          )}
                          {capacityLine(event)}
                        </div>
                        <p className="text-warm-600 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                      {renderRsvpControl(event, "shrink-0 bg-purple-700 hover:bg-purple-600 text-white")}
                    </div>
                  </div>
                </FadeIn>
              ))}
              {recommendedEvents.length === 0 && (
                <p className="text-center text-warm-500 py-12">
                  No recommended events at this time.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Birthdays Tab */}
          <TabsContent value="birthdays" className="mt-6">
            <p className="text-sm text-warm-500 mb-6">
              Upcoming member birthdays
            </p>
            <div className="grid grid-cols-1 gap-4">
              {upcomingEvents
                .filter((e) => e.id.startsWith("bday-"))
                .map((event, index) => (
                  <FadeIn key={event.id} delay={index * 0.05}>
                    <div className="bg-white rounded-xl px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 border-l-4 border-amber-400">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <Cake className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-heading font-semibold text-warm-900">
                            {event.title}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 text-sm text-warm-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(event.start_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              {upcomingEvents.filter((e) => e.id.startsWith("bday-")).length === 0 && (
                <p className="text-center text-warm-500 py-12">
                  No upcoming birthdays this week.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Past Tab */}
          <TabsContent value="past" className="mt-6">
            <div className="space-y-3">
              {pastEvents.filter((e) => !e.id.startsWith("bday-")).map((event, index) => (
                <FadeIn key={event.id} delay={index * 0.05}>
                  <div className="bg-white rounded-xl px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-heading font-semibold text-warm-900">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-warm-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(event.start_date)}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {rsvpedIds.has(event.id) && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 w-fit inline-flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        You RSVP&apos;d
                      </Badge>
                    )}
                  </div>
                </FadeIn>
              ))}
              {pastEvents.length === 0 && (
                <p className="text-center text-warm-500 py-12">
                  No past events to display.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
