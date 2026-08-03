export type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

/** Common recurrence schedules offered in the event form. */
export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/** Human label for a recurrence value ("" when it doesn't repeat). */
export function recurrenceLabel(r?: string | null): string {
  const found = RECURRENCE_OPTIONS.find((o) => o.value === r);
  return found && found.value !== "none" ? found.label : "";
}

type EventLike = {
  start_date: string;
  end_date?: string | null;
  recurrence?: string | null;
  recurrence_end?: string | null;
};

/**
 * Expand a (possibly recurring) event into concrete occurrences whose START
 * falls within [windowStart, windowEnd]. Each occurrence keeps the event's
 * time-of-day and duration and returns `occurrence_start` / `occurrence_end`
 * ISO strings. Non-recurring events yield at most one occurrence.
 */
export function expandOccurrences<T extends EventLike>(
  event: T,
  windowStart: Date,
  windowEnd: Date,
  cap = 60
): (T & { occurrence_start: string; occurrence_end: string | null })[] {
  const rec = (event.recurrence ?? "none") as Recurrence;
  const start = new Date(event.start_date);
  if (isNaN(start.getTime())) return [];
  const durationMs = event.end_date
    ? new Date(event.end_date).getTime() - start.getTime()
    : 0;
  const recEnd = event.recurrence_end
    ? new Date(event.recurrence_end + "T23:59:59")
    : null;

  const out: (T & { occurrence_start: string; occurrence_end: string | null })[] = [];
  const push = (d: Date) => {
    const occEnd = durationMs > 0 ? new Date(d.getTime() + durationMs) : null;
    out.push({
      ...event,
      occurrence_start: d.toISOString(),
      occurrence_end: occEnd ? occEnd.toISOString() : null,
    });
  };

  if (rec === "none") {
    if (start >= windowStart && start <= windowEnd) push(start);
    return out;
  }

  const advance = (d: Date): Date => {
    const n = new Date(d);
    switch (rec) {
      case "daily": n.setDate(n.getDate() + 1); break;
      case "weekly": n.setDate(n.getDate() + 7); break;
      case "biweekly": n.setDate(n.getDate() + 14); break;
      case "monthly": n.setMonth(n.getMonth() + 1); break;
      case "yearly": n.setFullYear(n.getFullYear() + 1); break;
      default: n.setDate(n.getDate() + 7);
    }
    return n;
  };

  let cur = new Date(start);
  let guard = 0;
  while (cur < windowStart && guard < 4000) {
    if (recEnd && cur > recEnd) return out;
    cur = advance(cur);
    guard++;
  }
  while (cur <= windowEnd && out.length < cap && guard < 6000) {
    if (recEnd && cur > recEnd) break;
    push(cur);
    cur = advance(cur);
    guard++;
  }
  return out;
}
