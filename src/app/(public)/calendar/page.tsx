"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CalendarDays,
} from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { CTAButton } from "@/components/shared/cta-button";
import { EditableText } from "@/components/cms/editable-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_EVENTS, MOCK_MINISTRIES } from "@/lib/mock-data";
import { formatTime, cn } from "@/lib/utils";
import type { Event } from "@/types";

/* ─── Helpers ─────────────────────────────────────────────────────── */

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

/** Returns true if event falls on or spans through the given day. */
function eventFallsOnDay(event: Event, day: Date): boolean {
  const start = new Date(event.start_date);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());

  if (event.end_date) {
    const end = new Date(event.end_date);
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return dayStart >= startDay && dayStart <= endDay;
  }

  return isSameDay(startDay, dayStart);
}

function getMinistryName(ministryId?: string): string | null {
  if (!ministryId) return null;
  const ministry = MOCK_MINISTRIES.find((m) => m.id === ministryId);
  return ministry?.name ?? null;
}

/** Check if event is a ministry event (has ministry_id) vs. church event */
function isMinistryEvent(event: Event): boolean {
  return !!event.ministry_id;
}

/** Get days needed to fill the calendar grid for a given month */
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

/* ─── Component ───────────────────────────────────────────────────── */

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const publishedEvents = useMemo(
    () => MOCK_EVENTS.filter((e) => e.is_published),
    []
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month]
  );

  /** Events keyed by day string for quick lookup */
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    calendarDays.forEach((day) => {
      const key = day.toDateString();
      const dayEvents = publishedEvents.filter((e) => eventFallsOnDay(e, day));
      if (dayEvents.length > 0) {
        map.set(key, dayEvents);
      }
    });
    return map;
  }, [calendarDays, publishedEvents]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return publishedEvents.filter((e) => eventFallsOnDay(e, selectedDate));
  }, [selectedDate, publishedEvents]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }, [year, month]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }, []);

  return (
    <>
      <PageHero
        title={<EditableText id="calendar.hero.title" fallback="Church Calendar" as="span" />}
        subtitle={<EditableText id="calendar.hero.subtitle" fallback="Stay connected with what's happening at Friendship Baptist" as="span" />}
        breadcrumbs={[{ label: "Calendar" }]}
      />

      {/* ── Calendar Section ────────────────────────────────────────── */}
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
                  <h2 className="text-fluid-2xl font-heading font-bold text-warm-900 dark:text-warm-50 min-w-[240px] text-center">
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
                      (e) => !isMinistryEvent(e)
                    );
                    const hasMinistryEvents = dayEvents.some((e) =>
                      isMinistryEvent(e)
                    );
                    const dayIsToday = isToday(day);
                    const isSelected =
                      selectedDate !== null && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "relative min-h-[72px] lg:min-h-[90px] p-2 border-b border-r border-warm-50 dark:border-warm-800 text-left transition-colors duration-150 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-inset",
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
                        {(hasChurchEvents || hasMinistryEvents) && (
                          <div className="flex gap-1 mt-1 ml-1">
                            {hasChurchEvents && (
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                            {hasMinistryEvents && (
                              <span className="w-2 h-2 rounded-full bg-peach-400" />
                            )}
                          </div>
                        )}

                        {/* Event count on larger screens */}
                        {dayEvents.length > 0 && isCurrentMonth && (
                          <div className="hidden lg:block mt-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  "text-[10px] leading-tight truncate rounded px-1 py-0.5 mb-0.5",
                                  isMinistryEvent(event)
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
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-warm-600 dark:text-warm-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Church Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-peach-400" />
                  <span>Ministry Events</span>
                </div>
              </div>

              {/* ── Day Detail Panel ──────────────────────────────────── */}
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
                              key={event.id}
                              className={cn(
                                "p-4 rounded-xl border",
                                isMinistryEvent(event)
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

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow text-center">
          <FadeIn>
            <h2 className="text-fluid-2xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-4">
              <EditableText id="calendar.cta.heading" fallback="Looking for Something Specific?" as="span" />
            </h2>
            <p className="text-warm-600 dark:text-warm-400 text-lg mb-8 max-w-xl mx-auto">
              <EditableText id="calendar.cta.description" fallback="Browse all upcoming events with full details, descriptions, and RSVP options." as="span" multiline />
            </p>
            <CTAButton href="/events" icon={<CalendarDays className="h-5 w-5" />}>
              View All Events
            </CTAButton>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
