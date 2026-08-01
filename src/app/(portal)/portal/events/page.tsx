"use client";

import { useState, useEffect } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin, Clock, CheckCircle, Loader2, CalendarCheck, CalendarX, Cake } from "lucide-react";

export default function MyEventsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registered");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [rsvpToast, setRsvpToast] = useState<string | null>(null);

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
              .then((d) => ({ id: e.id, rsvped: !!d.rsvped }))
              .catch(() => ({ id: e.id, rsvped: false }))
          )
        );
        const rsvpedSet = new Set(rsvpResults.filter((r) => r.rsvped).map((r) => r.id));
        setRsvpedIds(rsvpedSet);

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

  async function handleRsvp(eventId: string) {
    const isRsvped = rsvpedIds.has(eventId);
    setRsvpLoading(eventId);
    const res = await fetch(`/api/portal/events/${eventId}/rsvp`, {
      method: isRsvped ? "DELETE" : "POST",
    });
    setRsvpLoading(null);
    if (res.ok) {
      setRsvpedIds((prev) => {
        const next = new Set(prev);
        isRsvped ? next.delete(eventId) : next.add(eventId);
        return next;
      });
      setRsvpToast(isRsvped ? "RSVP cancelled" : "You're registered!");
      setTimeout(() => setRsvpToast(null), 3000);
    }
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
        <div role="alert" className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg bg-green-50 text-green-800 border border-green-200">
          <CheckCircle className="h-4 w-4 shrink-0" />{rsvpToast}
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
                        </div>
                        <p className="text-warm-600 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                      <Button
                        variant={rsvpedIds.has(event.id) ? "default" : "outline"}
                        className={rsvpedIds.has(event.id)
                          ? "shrink-0 bg-green-600 hover:bg-red-600 text-white"
                          : "shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50"}
                        disabled={rsvpLoading === event.id}
                        onClick={() => handleRsvp(event.id)}
                      >
                        {rsvpLoading === event.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : rsvpedIds.has(event.id)
                            ? <><CalendarCheck className="mr-2 h-4 w-4" />RSVPed</>
                            : <><CalendarX className="mr-2 h-4 w-4" />RSVP</>}
                      </Button>
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
                        </div>
                        <p className="text-warm-600 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                      <Button
                        className={rsvpedIds.has(event.id)
                          ? "shrink-0 bg-green-600 hover:bg-red-600 text-white"
                          : "shrink-0 bg-purple-700 hover:bg-purple-600 text-white"}
                        disabled={rsvpLoading === event.id}
                        onClick={() => handleRsvp(event.id)}
                      >
                        {rsvpLoading === event.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : rsvpedIds.has(event.id)
                            ? <><CalendarCheck className="mr-2 h-4 w-4" />RSVPed</>
                            : "RSVP"}
                      </Button>
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
