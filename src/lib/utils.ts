import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CHURCH_TZ = "America/New_York";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: CHURCH_TZ,
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CHURCH_TZ,
  }).format(new Date(date));
}

/**
 * Convert a UTC/ISO date string to a `datetime-local` input value in Eastern time.
 * e.g. "2026-06-20T15:00:00.000Z" → "2026-06-20T11:00" (EDT)
 */
export function toEasternInputValue(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHURCH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Convert a `datetime-local` input value (assumed Eastern) to a proper ISO string.
 * e.g. "2026-06-20T11:00" → "2026-06-20T15:00:00.000Z" (UTC, since EDT = UTC-4)
 *
 * Works by computing the Eastern UTC offset for the given date using Intl formatting,
 * then applying it. Handles EDT (-4) vs EST (-5) automatically.
 */
export function fromEasternInputValue(localValue: string): string {
  if (!localValue) return "";
  const naive = new Date(localValue + "Z");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHURCH_TZ,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(naive);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const match = tzPart.match(/GMT([+-]\d+)/);
  const offsetHours = match ? parseInt(match[1], 10) : -5;
  return new Date(naive.getTime() - offsetHours * 60 * 60 * 1000).toISOString();
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
