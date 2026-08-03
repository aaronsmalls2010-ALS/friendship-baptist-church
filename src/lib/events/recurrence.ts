// Outlook/Teams-style recurrence. The rule is stored as a JSON string in
// events.recurrence (legacy keyword strings like "weekly" are still understood).

export type RecurrenceRule =
  | { freq: "none" }
  | { freq: "daily"; interval: number }
  | { freq: "weekly"; interval: number; weekdays: number[] } // 0=Sun … 6=Sat
  | { freq: "monthly"; interval: number; mode: "day"; day: number } // day N of the month
  | { freq: "monthly"; interval: number; mode: "ordinal"; ordinals: number[]; weekday: number } // e.g. 2nd Sunday
  | { freq: "yearly"; interval: number; month: number; day: number };

export const WEEKDAYS = [
  { value: 0, short: "Sun", label: "Sunday" },
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
];

export const ORDINALS = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: -1, label: "Last" },
];

export const emptyRule: RecurrenceRule = { freq: "none" };

/** Parse the stored value (JSON rule, legacy keyword, or empty) into a rule. */
export function parseRule(raw?: string | null): RecurrenceRule {
  if (!raw || raw === "none") return { freq: "none" };
  const legacy: Record<string, RecurrenceRule> = {
    daily: { freq: "daily", interval: 1 },
    weekly: { freq: "weekly", interval: 1, weekdays: [] },
    biweekly: { freq: "weekly", interval: 2, weekdays: [] },
    monthly: { freq: "monthly", interval: 1, mode: "day", day: 0 },
    yearly: { freq: "yearly", interval: 1, month: 0, day: 0 },
  };
  if (legacy[raw]) return legacy[raw];
  try {
    const r = JSON.parse(raw);
    if (r && typeof r === "object" && typeof r.freq === "string") return r as RecurrenceRule;
  } catch {
    /* ignore */
  }
  return { freq: "none" };
}

export function serializeRule(rule: RecurrenceRule): string {
  return rule.freq === "none" ? "none" : JSON.stringify(rule);
}

const ord = (n: number) => (n === -1 ? "last" : ["", "1st", "2nd", "3rd", "4th", "5th"][n] ?? `${n}th`);

/** Human-readable summary, e.g. "Every 2nd Sunday of the month". */
export function describeRule(raw?: string | null): string {
  const r = parseRule(raw);
  switch (r.freq) {
    case "none":
      return "Does not repeat";
    case "daily":
      return r.interval > 1 ? `Every ${r.interval} days` : "Daily";
    case "weekly": {
      const days = (r.weekdays.length ? r.weekdays : [])
        .map((d) => WEEKDAYS[d]?.short)
        .filter(Boolean)
        .join(", ");
      const base = r.interval > 1 ? `Every ${r.interval} weeks` : "Weekly";
      return days ? `${base} on ${days}` : base;
    }
    case "monthly":
      if (r.mode === "ordinal") {
        const wd = WEEKDAYS[r.weekday]?.label ?? "";
        const parts = r.ordinals.map(ord).join(" & ");
        return `Every ${parts} ${wd} of the month`;
      }
      return `Day ${r.day} of every ${r.interval > 1 ? `${r.interval} months` : "month"}`;
    case "yearly":
      return "Yearly";
  }
}

// ── occurrence expansion ────────────────────────────────────────────────
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function ordinalInMonth(d: Date) {
  return Math.floor((d.getDate() - 1) / 7) + 1;
}
function isLastWeekdayInMonth(d: Date) {
  return d.getDate() + 7 > daysInMonth(d.getFullYear(), d.getMonth());
}
function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function fires(rule: RecurrenceRule, day: Date, base: Date): boolean {
  switch (rule.freq) {
    case "none":
      return false;
    case "daily": {
      const diff = Math.round((day.getTime() - startOfDay(base).getTime()) / 86400000);
      return diff >= 0 && diff % Math.max(1, rule.interval) === 0;
    }
    case "weekly": {
      const wds = rule.weekdays.length ? rule.weekdays : [base.getDay()];
      if (!wds.includes(day.getDay())) return false;
      if (rule.interval <= 1) return true;
      const weekDiff = Math.floor(
        (startOfWeek(day).getTime() - startOfWeek(base).getTime()) / (7 * 86400000)
      );
      return weekDiff % rule.interval === 0;
    }
    case "monthly": {
      const interval = Math.max(1, rule.interval);
      if (monthsBetween(base, day) % interval !== 0) return false;
      if (rule.mode === "ordinal") {
        if (day.getDay() !== rule.weekday) return false;
        const o = ordinalInMonth(day);
        return rule.ordinals.some((x) => x === o || (x === -1 && isLastWeekdayInMonth(day)));
      }
      const target = rule.day || base.getDate();
      return day.getDate() === target;
    }
    case "yearly": {
      const m = (rule.month || base.getMonth() + 1) - 1;
      const d = rule.day || base.getDate();
      return day.getMonth() === m && day.getDate() === d;
    }
  }
}

function startOfDay(d: Date) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
function startOfWeek(d: Date) {
  const n = startOfDay(d);
  n.setDate(n.getDate() - n.getDay());
  return n;
}

type EventLike = {
  start_date: string;
  end_date?: string | null;
  recurrence?: string | null;
  recurrence_end?: string | null;
};

/**
 * Expand a (possibly recurring) event into occurrences whose start falls within
 * [windowStart, windowEnd]. Iterates day-by-day over the window (small windows),
 * keeping each occurrence at the base event's time-of-day and duration.
 */
export function expandOccurrences<T extends EventLike>(
  event: T,
  windowStart: Date,
  windowEnd: Date,
  cap = 60
): (T & { occurrence_start: string; occurrence_end: string | null })[] {
  const rule = parseRule(event.recurrence);
  const base = new Date(event.start_date);
  if (isNaN(base.getTime())) return [];
  const durationMs = event.end_date
    ? new Date(event.end_date).getTime() - base.getTime()
    : 0;
  const recEnd = event.recurrence_end ? new Date(event.recurrence_end + "T23:59:59") : null;

  const out: (T & { occurrence_start: string; occurrence_end: string | null })[] = [];
  const emit = (d: Date) => {
    const occEnd = durationMs > 0 ? new Date(d.getTime() + durationMs) : null;
    out.push({
      ...event,
      occurrence_start: d.toISOString(),
      occurrence_end: occEnd ? occEnd.toISOString() : null,
    });
  };

  if (rule.freq === "none") {
    if (base >= windowStart && base <= windowEnd) emit(base);
    return out;
  }

  const hh = base.getHours();
  const mm = base.getMinutes();
  const cursor = startOfDay(new Date(Math.max(windowStart.getTime(), startOfDay(base).getTime())));
  let guard = 0;
  while (cursor <= windowEnd && out.length < cap && guard < 800) {
    guard++;
    if (recEnd && cursor > recEnd) break;
    if (fires(rule, cursor, base)) {
      const occ = new Date(cursor);
      occ.setHours(hh, mm, 0, 0);
      if (occ >= windowStart && occ <= windowEnd && occ >= base) emit(occ);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
