"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { Users, DollarSign, Calendar, Heart, Loader2, Lock, CalendarClock, ClipboardCheck } from "lucide-react";

// The trend charts are month-based, so the range control selects how many
// months of history to render (and therefore which donations/members are
// aggregated). This genuinely filters the data — it is not decorative.
const RANGES = [
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "12 Months", months: 12 },
] as const;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Member { id: string; created_at: string; }
interface Donation { id: string; amount: number; created_at: string; }
interface MinistryRow { id: string; name: string; ministry_members?: { count: number }[] }
interface PrayerRow { id: string; status?: string }
interface EventRow { id: string; start_date: string }
interface EventRsvp { id: string; title: string; rsvps: number }
interface AttendanceSessionRow {
  id: string;
  title: string;
  session_date: string;
  type: string;
  headcount: number | null;
  present_count: number;
}

interface MonthBucket { key: string; label: string }

/** Build the last `months` month buckets ending with the current month. */
function buildMonthBuckets(months: number): MonthBucket[] {
  const now = new Date();
  const out: MonthBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[d.getMonth()],
    });
  }
  return out;
}

function monthKey(iso: string): string {
  return String(iso).slice(0, 7); // "YYYY-MM"
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<number>(6);

  const [members, setMembers] = useState<Member[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [financeDenied, setFinanceDenied] = useState(false);
  const [ministries, setMinistries] = useState<MinistryRow[]>([]);
  const [prayers, setPrayers] = useState<PrayerRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventRsvps, setEventRsvps] = useState<EventRsvp[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSessionRow[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [membersRes, donationsRes, ministriesRes, prayerRes, eventsRes, rsvpRes, attendanceRes] =
          await Promise.all([
            fetch("/api/admin/members"),
            fetch("/api/admin/donations"),
            fetch("/api/admin/reports?type=ministries"),
            fetch("/api/admin/prayer-requests"),
            fetch("/api/admin/events"),
            fetch("/api/admin/analytics"),
            fetch("/api/admin/attendance"),
          ]);

        if (membersRes.ok) {
          const d = await membersRes.json();
          setMembers(d.members ?? []);
        }

        // Donations are finance-gated. A non-finance admin gets 403 — we surface
        // an honest "finance access required" state instead of empty numbers.
        if (donationsRes.ok) {
          const d = await donationsRes.json();
          setDonations(d.donations ?? []);
        } else if (donationsRes.status === 403) {
          setFinanceDenied(true);
        }

        if (ministriesRes.ok) {
          const d = await ministriesRes.json();
          setMinistries(d.ministries ?? []);
        }

        if (prayerRes.ok) {
          const d = await prayerRes.json();
          setPrayers(d.prayer_requests ?? d.prayerRequests ?? []);
        }

        if (eventsRes.ok) {
          const d = await eventsRes.json();
          setEvents(d.events ?? []);
        }

        if (rsvpRes.ok) {
          const d = await rsvpRes.json();
          setEventRsvps(d.eventRsvps ?? []);
        }

        if (attendanceRes.ok) {
          const d = await attendanceRes.json();
          setAttendanceSessions(d.sessions ?? []);
        }
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const buckets = useMemo(() => buildMonthBuckets(months), [months]);

  // Giving trends: aggregate real donation amounts by month (client-side from
  // the donations list). Scale caveat: this sums only the non-archived
  // donations returned by /api/admin/donations for the selected month window.
  const givingData = useMemo(() => {
    const sums = new Map<string, number>();
    for (const d of donations) {
      const k = monthKey(d.created_at);
      sums.set(k, (sums.get(k) ?? 0) + (Number(d.amount) || 0));
    }
    return buckets.map((b) => ({ ...b, amount: sums.get(b.key) ?? 0 }));
  }, [donations, buckets]);
  const maxGiving = Math.max(1, ...givingData.map((d) => d.amount));
  const periodGiving = givingData.reduce((s, d) => s + d.amount, 0);

  // Membership growth: cumulative real member count at the end of each month
  // (counted by profile created_at).
  const membershipData = useMemo(() => {
    return buckets.map((b) => {
      // Cumulative: members whose profile was created on or before this month.
      const count = members.filter((m) => monthKey(m.created_at) <= b.key).length;
      return { ...b, count };
    });
  }, [members, buckets]);
  const maxMembership = Math.max(1, ...membershipData.map((d) => d.count));

  // Top ministries: real roster sizes from ministry_members counts.
  const topMinistries = useMemo(() => {
    return ministries
      .map((m) => ({ name: m.name, members: m.ministry_members?.[0]?.count ?? 0 }))
      .sort((a, b) => b.members - a.members)
      .slice(0, 5);
  }, [ministries]);
  const maxMinistry = Math.max(1, ...topMinistries.map((m) => m.members));

  // Real event RSVP counts (NOT attendance — no attendance model exists).
  const topRsvps = useMemo(() => {
    return [...eventRsvps].sort((a, b) => b.rsvps - a.rsvps).slice(0, 5);
  }, [eventRsvps]);
  const maxRsvps = Math.max(1, ...topRsvps.map((e) => e.rsvps));

  // Attendance over time: the most recent sessions (API returns newest-first),
  // rendered oldest -> newest so the bars read left-to-right chronologically.
  const attendanceData = useMemo(() => {
    return [...attendanceSessions]
      .slice(0, 12)
      .reverse()
      .map((s) => ({
        id: s.id,
        title: s.title,
        count: s.present_count || s.headcount || 0,
        // DATE column is "YYYY-MM-DD"; anchor at noon so the label doesn't
        // shift a day under the church timezone.
        label: new Date(`${s.session_date}T12:00:00`).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        }),
      }));
  }, [attendanceSessions]);
  const maxAttendance = Math.max(1, ...attendanceData.map((d) => d.count));
  const totalAttendance = attendanceData.reduce((s, d) => s + d.count, 0);

  const now = Date.now();
  const eventsHeld = events.filter((e) => new Date(e.start_date).getTime() < now).length;
  const upcomingEvents = events.length - eventsHeld;

  const prayerTotal = prayers.length;
  const prayerPraying = prayers.filter((p) => p.status === "praying").length;
  const prayerAnswered = prayers.filter((p) => p.status === "answered").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description="Church engagement and growth metrics"
      />

      {/* Range Filter — selects how many months of history the trend charts show */}
      <FadeIn>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setMonths(range.months)}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                months === range.months
                  ? "bg-purple-700 text-white"
                  : "bg-warm-100 text-warm-600 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-300 dark:hover:bg-warm-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={members.length}
        />
        <StatCard
          icon={DollarSign}
          label="Giving (period)"
          value={financeDenied ? "—" : `$${periodGiving.toLocaleString()}`}
          trend={financeDenied ? "Finance access required" : undefined}
        />
        <StatCard
          icon={Calendar}
          label="Events Held"
          value={eventsHeld}
          trend={`${upcomingEvents} upcoming`}
        />
        <StatCard
          icon={Heart}
          label="Prayer Requests"
          value={prayerTotal}
          trend={`${prayerAnswered} answered`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Giving Trends */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                Monthly Giving
              </CardTitle>
            </CardHeader>
            <CardContent>
              {financeDenied ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center" style={{ minHeight: 200 }}>
                  <Lock className="h-6 w-6 text-warm-400" />
                  <p className="text-sm text-warm-500">
                    Giving data requires a finance role.
                  </p>
                </div>
              ) : periodGiving === 0 ? (
                <div className="flex items-center justify-center py-16 text-center" style={{ minHeight: 200 }}>
                  <p className="text-sm text-warm-500">No donations recorded in this period.</p>
                </div>
              ) : (
                <div className="flex items-end gap-3" style={{ height: 200 }}>
                  {givingData.map((d) => (
                    <div
                      key={d.key}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium text-warm-500">
                        ${(d.amount / 1000).toFixed(1)}k
                      </span>
                      <div
                        className="w-full rounded-t bg-purple-600 transition-all"
                        style={{
                          height: `${(d.amount / maxGiving) * 160}px`,
                        }}
                      />
                      <span className="text-xs text-warm-500">{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Membership Growth */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                Membership Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3" style={{ height: 200 }}>
                {membershipData.map((d) => (
                  <div
                    key={d.key}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium text-warm-500">
                      {d.count}
                    </span>
                    <div
                      className="w-full rounded-t bg-warm-400 transition-all"
                      style={{
                        height: `${(d.count / maxMembership) * 160}px`,
                      }}
                    />
                    <span className="text-xs text-warm-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Engagement Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Top Ministries */}
        <FadeIn>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                Top Ministries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topMinistries.length === 0 ? (
                <p className="py-8 text-center text-sm text-warm-500">No ministries yet.</p>
              ) : (
                <div className="space-y-4">
                  {topMinistries.map((ministry, i) => (
                    <div key={ministry.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-warm-700 dark:text-warm-300">
                          {i + 1}. {ministry.name}
                        </span>
                        <span className="text-warm-500">
                          {ministry.members} {ministry.members === 1 ? "member" : "members"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all"
                          style={{
                            width: `${(ministry.members / maxMinistry) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Event RSVPs — real RSVP counts. Attendance is NOT tracked in the
            schema, so we never invent attendance numbers here. */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                Event RSVPs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topRsvps.length === 0 || topRsvps.every((e) => e.rsvps === 0) ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <CalendarClock className="h-6 w-6 text-warm-400" />
                  <p className="text-sm text-warm-500">
                    No RSVPs yet. Attendance tracking is not yet enabled.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topRsvps.map((event) => (
                    <div key={event.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-warm-700 dark:text-warm-300">
                          {event.title}
                        </span>
                        <span className="text-warm-500">
                          {event.rsvps} {event.rsvps === 1 ? "RSVP" : "RSVPs"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
                        <div
                          className="h-full rounded-full bg-peach-400 transition-all"
                          style={{
                            width: `${(event.rsvps / maxRsvps) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Prayer Activity */}
        <FadeIn delay={0.2}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                Prayer Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-warm-50 p-3 dark:bg-warm-800">
                  <span className="text-sm font-medium text-warm-600 dark:text-warm-300">
                    Total Requests
                  </span>
                  <span className="text-lg font-bold text-warm-900 dark:text-warm-50">
                    {prayerTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Being Prayed For
                  </span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {prayerPraying}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Answered
                  </span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {prayerAnswered}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
