"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, DollarSign, Calendar, Heart, CalendarPlus, Megaphone, UserPlus, MessageCircle, HandCoins, ClipboardList, Clock, MapPin, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

interface AuditRow { id: string; action: string; resource_type: string; created_at: string; }

function auditIcon(action: string) {
  if (action.startsWith("donation")) return HandCoins;
  if (action.startsWith("member")) return UserPlus;
  if (action.startsWith("memorial")) return Heart;
  if (action.includes("export")) return ClipboardList;
  return Megaphone;
}

function auditLabel(row: AuditRow): string {
  const parts = row.action.split(".");
  const resource = row.resource_type.replace(/_/g, " ");
  const verb = parts[1] ?? parts[0];
  return `${verb.charAt(0).toUpperCase() + verb.slice(1)}: ${resource}`;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [auditFeed, setAuditFeed] = useState<AuditRow[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [monthlyDonations, setMonthlyDonations] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [prayerRequestsCount, setPrayerRequestsCount] = useState(0);
  const [nextEvents, setNextEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [membersRes, eventsRes, donationsRes, prayerRes, auditRes] = await Promise.all([
          fetch("/api/admin/members"),
          fetch("/api/admin/events"),
          fetch("/api/admin/donations"),
          fetch("/api/admin/prayer-requests"),
          fetch("/api/admin/audit?page=1"),
        ]);

        if (membersRes.ok) {
          const data = await membersRes.json();
          setTotalMembers(data.members?.length ?? 0);
        }

        if (eventsRes.ok) {
          const data = await eventsRes.json();
          const events: Event[] = data.events ?? [];
          const now = new Date();
          const upcoming = events
            .filter((e) => new Date(e.start_date) > now)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
          setUpcomingEventsCount(upcoming.length);
          setNextEvents(upcoming.slice(0, 5));
        }

        if (donationsRes.ok) {
          const data = await donationsRes.json();
          const donations = data.donations ?? [];
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const monthTotal = donations
            .filter((d: { date: string }) => d.date.startsWith(currentMonth))
            .reduce((sum: number, d: { amount: number }) => sum + d.amount, 0);
          setMonthlyDonations(monthTotal);
        }

        if (prayerRes.ok) {
          const data = await prayerRes.json();
          const requests = data.prayer_requests ?? data.prayerRequests ?? [];
          setPrayerRequestsCount(requests.length);
        }

        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditFeed((data.events ?? []).slice(0, 8));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
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
      <AdminPageHeader
        title="Dashboard"
        description="Overview of church activity"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={totalMembers}
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Donations"
          value={`$${monthlyDonations.toLocaleString()}`}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={upcomingEventsCount}
          trend={nextEvents.length > 0 ? `Next: ${formatDate(nextEvents[0].start_date)}` : "None scheduled"}
        />
        <StatCard
          icon={Heart}
          label="Prayer Requests"
          value={prayerRequestsCount}
        />
      </div>

      {/* Two-column: Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity — spans 2 columns on lg */}
        <FadeIn className="lg:col-span-2">
          <Card className="border-warm-100 dark:border-warm-800">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-warm-900 dark:text-warm-50">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditFeed.length === 0 ? (
                  <p className="text-sm text-warm-400 text-center py-4">No recent activity yet</p>
                ) : auditFeed.map((row) => {
                  const Icon = auditIcon(row.action);
                  return (
                    <div key={row.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-warm-50 dark:hover:bg-warm-800">
                      <div className="mt-0.5 rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                        <Icon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-800 dark:text-warm-100">{auditLabel(row)}</p>
                        <p className="flex items-center gap-1 text-xs text-warm-400">
                          <Clock className="h-3 w-3" />{timeAgo(row.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn>
          <Card className="border-warm-100 dark:border-warm-800">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-warm-900 dark:text-warm-50">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { href: "/admin/events", icon: CalendarPlus, label: "Create Event", color: "purple" },
                  { href: "/admin/announcements", icon: Megaphone, label: "Send Announcement", color: "amber" },
                  { href: "/admin/members", icon: UserPlus, label: "Add Member", color: "green" },
                  { href: "/admin/sms", icon: MessageCircle, label: "Send SMS", color: "blue" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link key={href} href={href}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 border-warm-200 py-6 text-left hover:border-purple-300 hover:bg-purple-50 dark:border-warm-700 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
                    >
                      <div className={`rounded-lg bg-${color}-100 p-2 dark:bg-${color}-900/40`}>
                        <Icon className={`h-4 w-4 text-${color}-700`} />
                      </div>
                      <span className="font-medium text-warm-800 dark:text-warm-100">{label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Upcoming Events */}
      <FadeIn>
        <Card className="border-warm-100 dark:border-warm-800">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-warm-900 dark:text-warm-50">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 rounded-lg border border-warm-100 p-4 transition-colors hover:bg-warm-50 dark:border-warm-800 dark:hover:bg-warm-800"
                >
                  <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-900/30">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warm-900 dark:text-warm-50">
                      {event.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-warm-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(event.start_date)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {nextEvents.length === 0 && (
                <p className="py-4 text-center text-sm text-warm-400">No upcoming events</p>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
