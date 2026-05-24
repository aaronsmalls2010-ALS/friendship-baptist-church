"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { FadeIn } from "@/components/motion/fade-in";
import { CTAButton } from "@/components/shared/cta-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { EditableText } from "@/components/cms/editable-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event, Ministry } from "@/types";

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [birthdayEvents, setBirthdayEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, ministriesRes, birthdaysRes] = await Promise.all([
          fetch("/api/public/events"),
          fetch("/api/public/ministries"),
          fetch("/api/public/birthdays"),
        ]);
        const eventsData = await eventsRes.json();
        const ministriesData = await ministriesRes.json();
        const birthdaysData = await birthdaysRes.json();
        setEvents(eventsData.events ?? []);
        setMinistries(ministriesData.ministries ?? []);

        // Convert birthday data into Event objects
        const currentYear = new Date().getFullYear();
        const bdays: Event[] = (birthdaysData.birthdays ?? [])
          .map(
            (p: {
              id: string;
              first_name: string;
              last_name: string;
              date_of_birth: string;
            }) => {
              const dob = new Date(p.date_of_birth + "T12:00:00");
              const birthdayThisYear = new Date(
                currentYear,
                dob.getMonth(),
                dob.getDate(),
                12,
                0,
                0
              );
              return {
                id: `bday-${p.id}`,
                title: `🎂 ${p.first_name} ${p.last_name}'s Birthday`,
                description: `Happy Birthday to ${p.first_name} ${p.last_name}! Wishing you many blessings.`,
                start_date: birthdayThisYear.toISOString(),
                location: "",
                rsvp_enabled: false,
                is_published: true,
                created_at: new Date().toISOString(),
              } as Event;
            }
          )
          .filter(Boolean);
        setBirthdayEvents(bdays);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();

  function getMinistryName(ministryId?: string): string | null {
    if (!ministryId) return null;
    const ministry = ministries.find((m) => m.id === ministryId);
    return ministry?.name ?? null;
  }

  const { featuredEvent, upcomingEvents, pastEvents } = useMemo(() => {
    // Merge regular events with birthday events
    const allEvents = [...events, ...birthdayEvents];
    const published = allEvents.filter((e) => e.is_published);
    const upcoming = published
      .filter((e) => new Date(e.start_date) > now)
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

    const past = published
      .filter((e) => new Date(e.start_date) <= now)
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

    // Don't use birthday events as the featured event
    const featured = upcoming.find((e) => !e.id.startsWith("bday-")) ?? null;
    const rest = upcoming.filter((e) => e !== featured);

    return { featuredEvent: featured, upcomingEvents: rest, pastEvents: past };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, birthdayEvents]);

  if (loading) {
    return (
      <>
        <PageHero
          title={<EditableText id="events.hero.title" fallback="Events & Happenings" as="span" />}
          subtitle={<EditableText id="events.hero.subtitle" fallback="Join us for worship, fellowship, and community" as="span" />}
          breadcrumbs={[{ label: "Events" }]}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title={<EditableText id="events.hero.title" fallback="Events & Happenings" as="span" />}
        subtitle={<EditableText id="events.hero.subtitle" fallback="Join us for worship, fellowship, and community" as="span" />}
        breadcrumbs={[{ label: "Events" }]}
      />

      {/* ── Featured Event ──────────────────────────────────────────── */}
      {featuredEvent && (
        <section className="section-padding">
          <div className="container-wide">
            <FadeIn>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-8 lg:p-12 relative overflow-hidden">
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 dark:bg-purple-900/20 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="bg-purple-700 text-white border-purple-700 hover:bg-purple-600">
                      Featured Event
                    </Badge>
                    {featuredEvent.rsvp_enabled && (
                      <Badge className="bg-gold-400 text-warm-900 border-gold-400 hover:bg-gold-300">
                        RSVP
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-fluid-2xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-4">
                    {featuredEvent.title}
                  </h2>

                  <p className="text-warm-700 dark:text-warm-300 text-lg leading-relaxed max-w-3xl mb-6">
                    {featuredEvent.description}
                  </p>

                  <div className="flex flex-wrap gap-6 text-warm-600 dark:text-warm-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">
                        {formatDate(featuredEvent.start_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <span>
                        {formatTime(featuredEvent.start_date)}
                        {featuredEvent.end_date &&
                          ` — ${formatTime(featuredEvent.end_date)}`}
                      </span>
                    </div>
                    {featuredEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <span>{featuredEvent.location}</span>
                      </div>
                    )}
                  </div>

                  {featuredEvent.rsvp_enabled && (
                    <div className="mt-8">
                      <Button className="bg-purple-700 hover:bg-purple-600 text-white px-8 py-3 text-base rounded-xl">
                        RSVP Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ── Upcoming Events ─────────────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <section className="section-padding bg-warm-50 dark:bg-warm-950">
          <div className="container-wide">
            <FadeIn>
              <SectionHeading
                title={<EditableText id="events.upcoming.heading" fallback="Upcoming Events" as="span" />}
                subtitle={<EditableText id="events.upcoming.subtitle" fallback="Mark your calendar and join us" as="span" />}
              />
            </FadeIn>

            <SlideUpContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => {
                const ministryName = getMinistryName(event.ministry_id);

                return (
                  <SlideUpItem key={event.id}>
                    <div className="bg-white dark:bg-warm-900 rounded-xl shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 overflow-hidden flex flex-col h-full">
                      {/* Date strip */}
                      <div className="bg-purple-700 px-6 py-3 flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-white/80" />
                        <span className="text-sm font-medium text-white">
                          {formatDate(event.start_date)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {ministryName && (
                            <Badge
                              variant="secondary"
                              className="bg-peach-100 text-peach-700 border-peach-200 dark:bg-peach-900/30 dark:text-peach-300"
                            >
                              {ministryName}
                            </Badge>
                          )}
                          {event.rsvp_enabled && (
                            <Badge className="bg-gold-100 text-gold-800 border-gold-200 dark:bg-gold-900/30 dark:text-gold-300">
                              RSVP Open
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-heading text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2">
                          {event.title}
                        </h3>

                        <p className="text-warm-600 dark:text-warm-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                          {event.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-warm-500 dark:text-warm-400 mb-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-purple-400" />
                            <span>
                              {formatTime(event.start_date)}
                              {event.end_date &&
                                ` — ${formatTime(event.end_date)}`}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-purple-400" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.rsvp_enabled && (
                          <Button
                            variant="ghost"
                            className="self-start -ml-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 gap-1.5 text-sm font-medium p-2 h-auto"
                          >
                            RSVP
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </SlideUpItem>
                );
              })}
            </SlideUpContainer>
          </div>
        </section>
      )}

      {/* ── Scripture Divider ────────────────────────────────────────── */}
      <ScriptureDivider
        text={<EditableText id="events.scripture.text" fallback="For where two or three gather in my name, there am I with them." as="span" multiline />}
        reference={<EditableText id="events.scripture.reference" fallback="Matthew 18:20" as="span" />}
      />

      {/* ── Past Events ─────────────────────────────────────────────── */}
      {pastEvents.length > 0 && (
        <section className="section-padding">
          <div className="container-wide">
            <FadeIn>
              <SectionHeading
                title={<EditableText id="events.past.heading" fallback="Past Events" as="span" />}
                subtitle={<EditableText id="events.past.subtitle" fallback="A look back at recent gatherings" as="span" />}
              />
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible>
                  <AccordionItem value="past-events">
                    <AccordionTrigger className="text-warm-900 dark:text-warm-100 font-heading text-lg hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        View Past Events ({pastEvents.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {pastEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start gap-4 p-4 rounded-lg bg-warm-50 dark:bg-warm-900/50 border border-warm-100 dark:border-warm-800"
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-warm-900 dark:text-warm-100 text-sm">
                                {event.title}
                              </h4>
                              <p className="text-warm-500 dark:text-warm-400 text-xs mt-0.5">
                                {formatDate(event.start_date)}
                                {event.location && ` • ${event.location}`}
                              </p>
                              <p className="text-warm-600 dark:text-warm-400 text-sm mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow text-center">
          <FadeIn>
            <h2 className="text-fluid-2xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-4">
              <EditableText id="events.cta.heading" fallback="Never Miss a Gathering" as="span" />
            </h2>
            <p className="text-warm-600 dark:text-warm-400 text-lg mb-8 max-w-xl mx-auto">
              <EditableText id="events.cta.description" fallback="View our full church calendar to stay connected with everything happening at Friendship Baptist." as="span" multiline />
            </p>
            <CTAButton href="/calendar" icon={<CalendarDays className="h-5 w-5" />}>
              View Calendar
            </CTAButton>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
