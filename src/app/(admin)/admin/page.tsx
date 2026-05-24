"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Calendar, Heart, CalendarPlus, Megaphone, UserPlus, MessageCircle, HandCoins, ClipboardList, Clock, MapPin, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

// Hard-coded recent activity feed
const recentActivity = [
  { id: 1, icon: MessageCircle, text: "New prayer request from Sister Martha", time: "2 hours ago" },
  { id: 2, icon: HandCoins, text: "Donation of $250 received from Brother James", time: "5 hours ago" },
  { id: 3, icon: ClipboardList, text: "Event registration: VBS — Crystal Young", time: "Yesterday" },
  { id: 4, icon: UserPlus, text: "New member registration: Gloria Campbell", time: "2 days ago" },
  { id: 5, icon: Megaphone, text: "Announcement published: VBS Volunteer Sign-Up", time: "3 days ago" },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [monthlyDonations, setMonthlyDonations] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [prayerRequestsCount, setPrayerRequestsCount] = useState(0);
  const [nextEvents, setNextEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [membersRes, eventsRes, donationsRes, prayerRes] = await Promise.all([
          fetch("/api/admin/members"),
          fetch("/api/admin/events"),
          fetch("/api/admin/donations"),
          fetch("/api/admin/prayer-requests"),
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
          trend="+3 this month"
          trendUp
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Donations"
          value={`$${monthlyDonations.toLocaleString()}`}
          trend="+12% from last month"
          trendUp
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
          trend="+2 this week"
          trendUp
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
                {recentActivity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-warm-50 dark:hover:bg-warm-800"
                    >
                      <div className="mt-0.5 rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                        <Icon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-800 dark:text-warm-100">
                          {item.text}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-warm-400">
                          <Clock className="h-3 w-3" />
                          {item.time}
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
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-warm-200 py-6 text-left hover:border-purple-300 hover:bg-purple-50 dark:border-warm-700 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
                >
                  <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/40">
                    <CalendarPlus className="h-4 w-4 text-purple-700" />
                  </div>
                  <span className="font-medium text-warm-800 dark:text-warm-100">Create Event</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-warm-200 py-6 text-left hover:border-purple-300 hover:bg-purple-50 dark:border-warm-700 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
                >
                  <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/40">
                    <Megaphone className="h-4 w-4 text-amber-700" />
                  </div>
                  <span className="font-medium text-warm-800 dark:text-warm-100">Send Announcement</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-warm-200 py-6 text-left hover:border-purple-300 hover:bg-purple-50 dark:border-warm-700 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
                >
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/40">
                    <UserPlus className="h-4 w-4 text-green-700" />
                  </div>
                  <span className="font-medium text-warm-800 dark:text-warm-100">Add Member</span>
                </Button>
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
