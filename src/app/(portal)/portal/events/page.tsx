"use client";

import { useState, useEffect } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function MyEventsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registered");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/portal/events");
        if (res.ok) {
          const data = await res.json();
          const events = data.events || [];
          const now = new Date();

          // Split into upcoming vs past
          const upcoming = events.filter(
            (e: any) => new Date(e.start_date) >= now
          );
          const past = events.filter(
            (e: any) => new Date(e.start_date) < now
          );

          setUpcomingEvents(upcoming);
          setPastEvents(past);

          // Registered events: pick first 3 upcoming
          setRegisteredEvents(upcoming.slice(0, 3));

          // Recommended events: events with ministry_id that aren't in registered
          const registered = upcoming.slice(0, 3);
          const recommended = upcoming
            .filter(
              (e: any) =>
                e.ministry_id &&
                !registered.some((r: any) => r.id === e.id)
            )
            .slice(0, 3);
          setRecommendedEvents(recommended);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
                        variant="outline"
                        className="shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        View Details
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
                      <Button className="shrink-0 bg-purple-700 hover:bg-purple-600 text-white">
                        Register
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

          {/* Past Tab */}
          <TabsContent value="past" className="mt-6">
            <div className="space-y-3">
              {pastEvents.map((event, index) => (
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
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 w-fit inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Attended
                    </Badge>
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
