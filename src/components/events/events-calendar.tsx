"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { expandOccurrences, parseRule } from "@/lib/events/recurrence";
import {
  type Occurrence,
  WEEKDAYS,
  MONTH_NAMES,
  isSameDay,
  isToday,
  occurrenceFallsOnDay,
  isMinistryEvent,
  isBirthdayEvent,
  getCalendarDays,
} from "@/lib/events/calendar";
import type { Event, Ministry } from "@/types";

interface EventsCalendarProps {
  /** Base (unexpanded) published events. Recurrence is expanded internally. */
  events: Event[];
  /** Birthday pseudo-events (ids prefixed "bday-"). */
  birthdayEvents: Event[];
  ministries: Ministry[];
  /** CTA rendered inside the large Featured Event card. */
  featuredCta?: (occ: Occurrence) => ReactNode;
  /** CTA rendered inside each Upcoming Event card. */
  cardCta?: (occ: Occurrence) => ReactNode;
  upcomingHeading?: ReactNode;
  upcomingSubtitle?: ReactNode;
  pastHeading?: ReactNode;
  pastSubtitle?: ReactNode;
  /** Optional block rendered between Upcoming and Past (e.g. a scripture divider). */
  middleSlot?: ReactNode;
  /** Render the "Past Events" section. Defaults to true. */
  showPast?: boolean;
  /**
   * If set, recurring events are only projected this many days into the future.
   * One-off events are unaffected. Leave undefined for no cap.
   */
  recurrenceHorizonDays?: number;
}

/**
 * The shared calendar + featured/upcoming/past events view. Rendered on both the
 * public Events page and the member portal Events page so they stay in sync.
 * Chrome (hero, CMS headings, page CTA) lives in each page wrapper.
 */
export function EventsCalendar({
  events,
  birthdayEvents,
  ministries,
  featuredCta,
  cardCta,
  upcomingHeading = "Upcoming Events",
  upcomingSubtitle = "Mark your calendar and join us",
  pastHeading = "Past Events",
  pastSubtitle = "A look back at recent gatherings",
  middleSlot,
  showPast = true,
  recurrenceHorizonDays,
}: EventsCalendarProps) {
  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // When a recurrence horizon is set, recurring events are only projected up to
  // that cutoff; one-off events (freq "none") are always kept.
  const recurrenceHorizon = useMemo(
    () =>
      recurrenceHorizonDays != null
        ? Date.now() + recurrenceHorizonDays * 24 * 60 * 60 * 1000
        : null,
    [recurrenceHorizonDays]
  );

  const withinHorizon = useCallback(
    (occ: Occurrence): boolean => {
      if (recurrenceHorizon == null) return true;
      if (parseRule(occ.recurrence).freq === "none") return true;
      return new Date(occ.occurrence_start).getTime() <= recurrenceHorizon;
    },
    [recurrenceHorizon]
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
      .filter(withinHorizon)
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

  // First occurrence of each base id gets the anchor id, so deep links like
  // /events#<id> resolve to exactly one element.
  const anchorIds = useMemo(() => {
    // The featured card already owns its base id's anchor, so skip it here to
    // avoid a duplicate DOM id when a later occurrence of the same event recurs.
    const seen = new Set<string>(featuredEvent ? [featuredEvent.id] : []);
    const keys = new Set<string>();
    for (const occ of upcomingEvents) {
      if (seen.has(occ.id)) continue;
      seen.add(occ.id);
      keys.add(`${occ.id}-${occ.occurrence_start}`);
    }
    return keys;
  }, [upcomingEvents, featuredEvent]);

  // On mount, if the URL carries a #<id>, scroll to it and briefly highlight.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-purple-400", "ring-offset-2");
    const t = setTimeout(
      () => el.classList.remove("ring-2", "ring-purple-400", "ring-offset-2"),
      2600
    );
    return () => clearTimeout(t);
  }, []);

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
    return publishedEvents
      .flatMap((e) => expandOccurrences(e, windowStart, windowEnd))
      .filter(withinHorizon);
  }, [calendarDays, publishedEvents, withinHorizon]);

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

  return (
    <>
      {/* One combined view — calendar first, list underneath */}
      <div className="flex flex-col">
        <div className="order-2">
          {/* ── Featured Event ──────────────────────────────────────── */}
          {featuredEvent && (
            <section className="section-padding">
              <div className="container-wide">
                <FadeIn>
                  <div
                    id={featuredEvent.id}
                    className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-8 lg:p-12 relative overflow-hidden scroll-mt-24 transition-shadow"
                  >
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

                      {(() => {
                        const node = featuredCta?.(featuredEvent);
                        return node ? <div className="mt-8">{node}</div> : null;
                      })()}
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
                    title={upcomingHeading}
                    subtitle={upcomingSubtitle}
                  />
                </FadeIn>

                <SlideUpContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcomingEvents.map((event) => {
                    const ministryName = getMinistryName(event.ministry_id);
                    const occKey = `${event.id}-${event.occurrence_start}`;

                    return (
                      <SlideUpItem key={occKey}>
                        <div
                          id={anchorIds.has(occKey) ? event.id : undefined}
                          className="bg-white dark:bg-warm-900 rounded-xl shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 overflow-hidden flex flex-col h-full scroll-mt-24"
                        >
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

                            {cardCta && cardCta(event)}
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

          {/* ── Middle slot (e.g. scripture divider) ────────────────── */}
          {middleSlot}

          {/* ── Past Events ─────────────────────────────────────────── */}
          {showPast && pastEvents.length > 0 && (
            <section className="section-padding">
              <div className="container-wide">
                <FadeIn>
                  <SectionHeading title={pastHeading} subtitle={pastSubtitle} />
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
        </div>

        {/* Calendar (shown first) */}
        <div className="order-1">
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
        </div>
      </div>
    </>
  );
}
