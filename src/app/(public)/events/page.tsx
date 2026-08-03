"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  CalendarRange,
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
import { formatDate, formatTime, cn } from "@/lib/utils";
import { expandOccurrences } from "@/lib/events/recurrence";
import type { Event, Ministry } from "@/types";

/* ─── Types & helpers ─────────────────────────────────────────────── */

/** An event expanded to a specific occurrence date. */
type Occurrence = Event & {
  occurrence_start: string;
  occurrence_end: string | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Returns true if an expanded occurrence falls on (or spans through) a day. */
function occurrenceFallsOnDay(occ: Occurrence, day: Date): boolean {
  const start = new Date(occ.occurrence_start);
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());

  if (occ.occurrence_end) {
    const end = new Date(occ.occurrence_end);
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return dayStart >= startDay && dayStart <= endDay;
  }

  return isSameDay(startDay, dayStart);
}

function isMinistryEvent(event: Event): boolean {
  return !!event.ministry_id;
}

function isBirthdayEvent(event: Event): boolean {
  return event.id.startsWith("bday-");
}

/** Days needed to fill the calendar grid for a given month (leading/trailing fill). */
function getCalendarDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun
  const daysInMonth = lastDayOfMonth.getDate();

  const days: Date[] = [];

  // Previous month fill
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  // Next month fill — ensure we have complete rows (multiple of 7)
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
}

type ViewMode = "list" | "calendar";

/* ─── Component ───────────────────────────────────────────────────── */

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [birthdayEvents, setBirthdayEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [view, setView] = useState<ViewMode>("list");

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

        // Convert birthday data into Event objects for the current and next
        // year so both the 120-day list window and calendar navigation across
        // a year boundary still show birthdays.
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
              const bdayDate = new Date(
                yr,
                dob.getMonth(),
                dob.getDate(),
                12,
                0,
                0
              );
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

  const publishedEvents = useMemo(
    () => [...events, ...birthdayEvents].filter((e) => e.is_published),
    [events, birthdayEvents]
  );

  /* ── LIST: expand recurring events over the next 120 days ─────────── */
  const { featuredEvent, upcomingEvents, pastEvents } = useMemo(() => {
    const windowStart = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 120);

    // Every published event expanded to its occurrences inside the window.
    const occurrences: Occurrence[] = publishedEvents
      .flatMap((e) => expandOccurrences(e, windowStart, windowEnd))
      .filter((o) => new Date(o.occurrence_start) > windowStart)
      .sort(
        (a, b) =>
          new Date(a.occurrence_start).getTime() -
          new Date(b.occurrence_start).getTime()
      );

    // First non-birthday occurrence becomes the featured event.
    const featured = occurrences.find((o) => !isBirthdayEvent(o)) ?? null;
    const rest = occurrences.filter((o) => o !== featured);

    // Past events: base (non-expanded) published events already behind us.
    const past = publishedEvents
      .filter((e) => !isBirthdayEvent(e) && new Date(e.start_date) <= now)
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

    return { featuredEvent: featured, upcomingEvents: rest, pastEvents: past };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedEvents]);

  /* ── CALENDAR: expand over the visible month's range ──────────────── */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month]
  );

  // All occurrences that fall anywhere within the visible grid range.
  const monthOccurrences = useMemo(() => {
    if (calendarDays.length === 0) return [] as Occurrence[];
    const windowStart = new Date(calendarDays[0]);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(calendarDays[calendarDays.length - 1]);
    windowEnd.setHours(23, 59, 59, 999);
    return publishedEvents.flatMap((e) =>
      expandOccurrences(e, windowStart, windowEnd)
    );
  }, [calendarDays, publishedEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    calendarDays.forEach((day) => {
      const key = day.toDateString();
      const dayEvents = monthOccurrences.filter((o) =>
        occurrenceFallsOnDay(o, day)
      );
      if (dayEvents.length > 0) map.set(key, dayEvents);
    });
    return map;
  }, [calendarDays, monthOccurrences]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return monthOccurrences.filter((o) =>
      occurrenceFallsOnDay(o, selectedDate)
    );
  }, [selectedDate, monthOccurrences]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }, [year, month]);

  const goToToday = useCallback(() => {
    const nowDate = new Date();
    setCurrentMonth(new Date(nowDate.getFullYear(), nowDate.getMonth(), 1));
    setSelectedDate(nowDate);
  }, []);

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

      {/* ── View Toggle ─────────────────────────────────────────────── */}
      <section className="pt-8 lg:pt-10">
        <div className="container-wide">
          <FadeIn>
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-warm-100 dark:bg-warm-900 border border-warm-200 dark:border-warm-800"
              role="tablist"
              aria-label="Choose events view"
            >
              <button
                role="tab"
                aria-selected={view === "list"}
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                  view === "list"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-warm-600 dark:text-warm-300 hover:text-purple-700 dark:hover:text-purple-300"
                )}
              >
                <ListIcon className="h-4 w-4" />
                List
              </button>
              <button
                role="tab"
                aria-selected={view === "calendar"}
                onClick={() => setView("calendar")}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                  view === "calendar"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-warm-600 dark:text-warm-300 hover:text-purple-700 dark:hover:text-purple-300"
                )}
              >
                <CalendarRange className="h-4 w-4" />
                Calendar
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ LIST VIEW ═══════════════════════════════════════════════════ */}
      {view === "list" && (
        <>
          {/* ── Featured Event ──────────────────────────────────────── */}
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
                            {formatDate(featuredEvent.occurrence_start)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <span>
                            {formatTime(featuredEvent.occurrence_start)}
                            {featuredEvent.occurrence_end &&
                              ` — ${formatTime(featuredEvent.occurrence_end)}`}
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
                          <a href={`/contact?subject=${encodeURIComponent(`RSVP: ${featuredEvent.title}`)}`}>
                            <Button className="bg-purple-700 hover:bg-purple-600 text-white px-8 py-3 text-base rounded-xl">
                              RSVP Now
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              </div>
            </section>
          )}

          {/* ── Upcoming Events ─────────────────────────────────────── */}
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
                      <SlideUpItem key={`${event.id}-${event.occurrence_start}`}>
                        <div className="bg-white dark:bg-warm-900 rounded-xl shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 overflow-hidden flex flex-col h-full">
                          {/* Date strip */}
                          <div className="bg-purple-700 px-6 py-3 flex items-center gap-3">
                            <CalendarDays className="h-4 w-4 text-white/80" />
                            <span className="text-sm font-medium text-white">
                              {formatDate(event.occurrence_start)}
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
                                  {formatTime(event.occurrence_start)}
                                  {event.occurrence_end &&
                                    ` — ${formatTime(event.occurrence_end)}`}
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
                              <a href={`/contact?subject=${encodeURIComponent(`RSVP: ${event.title}`)}`}>
                                <Button
                                  variant="ghost"
                                  className="self-start -ml-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 gap-1.5 text-sm font-medium p-2 h-auto"
                                >
                                  RSVP
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </a>
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

          {/* ── Empty state (no upcoming) ───────────────────────────── */}
          {!featuredEvent && upcomingEvents.length === 0 && (
            <section className="section-padding">
              <div className="container-narrow text-center">
                <FadeIn>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                    <CalendarDays className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-fluid-xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-3">
                    No Upcoming Events
                  </h2>
                  <p className="text-warm-600 dark:text-warm-400 max-w-md mx-auto">
                    There are no events scheduled right now. Check back soon —
                    new gatherings are added often.
                  </p>
                </FadeIn>
              </div>
            </section>
          )}

          {/* ── Scripture Divider ───────────────────────────────────── */}
          <ScriptureDivider
            text={<EditableText id="events.scripture.text" fallback="For where two or three gather in my name, there am I with them." as="span" multiline />}
            reference={<EditableText id="events.scripture.reference" fallback="Matthew 18:20" as="span" />}
          />

          {/* ── Past Events ─────────────────────────────────────────── */}
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
        </>
      )}

      {/* ══ CALENDAR VIEW ═══════════════════════════════════════════════ */}
      {view === "calendar" && (
        <section className="section-padding">
          <div className="container-wide">
            <FadeIn>
              <div className="max-w-5xl mx-auto">
                {/* Month Header & Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPreviousMonth}
                      className="h-10 w-10 border-warm-200 dark:border-warm-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-fluid-2xl font-heading font-bold text-warm-900 dark:text-warm-50 min-w-[200px] sm:min-w-[240px] text-center">
                      {MONTH_NAMES[month]} {year}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextMonth}
                      className="h-10 w-10 border-warm-200 dark:border-warm-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={goToToday}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
                  >
                    Today
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-100 dark:border-warm-800 overflow-hidden">
                  {/* Weekday Header */}
                  <div className="grid grid-cols-7 bg-purple-50 dark:bg-purple-950/30 border-b border-warm-100 dark:border-warm-800">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="py-3 text-center text-sm font-semibold text-purple-700 dark:text-purple-300"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Cells */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === month;
                      const dayKey = day.toDateString();
                      const dayEvents = eventsByDay.get(dayKey) ?? [];
                      const hasChurchEvents = dayEvents.some(
                        (e) => !isMinistryEvent(e) && !isBirthdayEvent(e)
                      );
                      const hasMinistryEvents = dayEvents.some((e) =>
                        isMinistryEvent(e)
                      );
                      const hasBirthdayEvents = dayEvents.some((e) =>
                        isBirthdayEvent(e)
                      );
                      const dayIsToday = isToday(day);
                      const isSelected =
                        selectedDate !== null && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "relative min-h-[72px] lg:min-h-[90px] p-2 border-b border-r border-warm-50 dark:border-warm-800 text-left transition-colors duration-150 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-inset cursor-pointer",
                            !isCurrentMonth &&
                              "bg-warm-50/50 dark:bg-warm-950/30",
                            isSelected &&
                              "bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-400 ring-inset"
                          )}
                          aria-label={`${day.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                        >
                          {/* Day Number */}
                          <span
                            className={cn(
                              "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                              isCurrentMonth
                                ? "text-warm-900 dark:text-warm-100"
                                : "text-warm-300 dark:text-warm-600",
                              dayIsToday &&
                                "ring-2 ring-purple-500 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 font-bold"
                            )}
                          >
                            {day.getDate()}
                          </span>

                          {/* Event Dots */}
                          {(hasChurchEvents ||
                            hasMinistryEvents ||
                            hasBirthdayEvents) && (
                            <div className="flex gap-1 mt-1 ml-1">
                              {hasChurchEvents && (
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                              )}
                              {hasMinistryEvents && (
                                <span className="w-2 h-2 rounded-full bg-peach-400" />
                              )}
                              {hasBirthdayEvents && (
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                              )}
                            </div>
                          )}

                          {/* Event titles on larger screens */}
                          {dayEvents.length > 0 && isCurrentMonth && (
                            <div className="hidden lg:block mt-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={`${event.id}-${event.occurrence_start}`}
                                  className={cn(
                                    "text-[10px] leading-tight truncate rounded px-1 py-0.5 mb-0.5",
                                    isBirthdayEvent(event)
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                      : isMinistryEvent(event)
                                        ? "bg-peach-100 text-peach-700 dark:bg-peach-900/30 dark:text-peach-300"
                                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  )}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <span className="text-[10px] text-warm-400">
                                  +{dayEvents.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm text-warm-600 dark:text-warm-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>Church Events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-peach-400" />
                    <span>Ministry Events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span>Birthdays</span>
                  </div>
                </div>

                {/* ── Day Detail Panel ──────────────────────────────── */}
                {selectedDate && (
                  <FadeIn key={selectedDate.toDateString()} duration={0.3}>
                    <div className="mt-8 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-100 dark:border-warm-800 p-6 lg:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold text-warm-900 dark:text-warm-50">
                            {selectedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </h3>
                          <p className="text-sm text-warm-500 dark:text-warm-400">
                            {selectedDayEvents.length === 0
                              ? "No events on this day."
                              : `${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>

                      {selectedDayEvents.length > 0 && (
                        <div className="space-y-4">
                          {selectedDayEvents.map((event) => {
                            const ministryName = getMinistryName(
                              event.ministry_id
                            );
                            return (
                              <div
                                key={`${event.id}-${event.occurrence_start}`}
                                className={cn(
                                  "p-4 rounded-xl border",
                                  isBirthdayEvent(event)
                                    ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30"
                                    : isMinistryEvent(event)
                                      ? "bg-peach-50/50 border-peach-100 dark:bg-peach-950/10 dark:border-peach-900/30"
                                      : "bg-purple-50/50 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/30"
                                )}
                              >
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h4 className="font-heading font-semibold text-warm-900 dark:text-warm-50">
                                    {event.title}
                                  </h4>
                                  {ministryName && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-peach-100 text-peach-700 border-peach-200 dark:bg-peach-900/30 dark:text-peach-300 text-xs"
                                    >
                                      {ministryName}
                                    </Badge>
                                  )}
                                  {event.rsvp_enabled && (
                                    <Badge className="bg-gold-100 text-gold-800 border-gold-200 dark:bg-gold-900/30 dark:text-gold-300 text-xs">
                                      RSVP
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-warm-600 dark:text-warm-400 text-sm mb-3">
                                  {event.description}
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm text-warm-500 dark:text-warm-400">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                                    <span>
                                      {formatTime(event.occurrence_start)}
                                      {event.occurrence_end &&
                                        ` — ${formatTime(event.occurrence_end)}`}
                                    </span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 text-purple-400" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FadeIn>
                )}
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
              <EditableText id="events.cta.description" fallback="Switch between the list and calendar views above to stay connected with everything happening at Friendship Baptist." as="span" multiline />
            </p>
            <CTAButton
              href="/contact"
              icon={<CalendarDays className="h-5 w-5" />}
            >
              Get in Touch
            </CTAButton>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
