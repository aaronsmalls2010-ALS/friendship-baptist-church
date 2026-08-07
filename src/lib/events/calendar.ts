// Shared calendar helpers used by both the public Events page and the member
// portal Events page so the two views stay in lockstep. Pure date math only —
// no React — safe to import anywhere.

import type { Event } from "@/types";

/** An event expanded to a specific occurrence date. */
export type Occurrence = Event & {
  occurrence_start: string;
  occurrence_end: string | null;
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES = [
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

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Returns true if an expanded occurrence falls on (or spans through) a day. */
export function occurrenceFallsOnDay(occ: Occurrence, day: Date): boolean {
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

export function isMinistryEvent(event: Event): boolean {
  return !!event.ministry_id;
}

export function isBirthdayEvent(event: Event): boolean {
  return event.id.startsWith("bday-");
}

/** Days needed to fill the calendar grid for a given month (leading/trailing fill). */
export function getCalendarDays(year: number, month: number): Date[] {
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
