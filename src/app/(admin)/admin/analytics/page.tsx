"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOCK_PROFILES, MOCK_PRAYER_REQUESTS } from "@/lib/mock-data";
import { FadeIn } from "@/components/motion/fade-in";
import { Users, DollarSign, Calendar, Heart } from "lucide-react";

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "Year"] as const;

const givingData = [
  { month: "Jan", amount: 1200 },
  { month: "Feb", amount: 1800 },
  { month: "Mar", amount: 1400 },
  { month: "Apr", amount: 2200 },
  { month: "May", amount: 900 },
  { month: "Jun", amount: 1600 },
];

const membershipData = [
  { month: "Jan", count: 58 },
  { month: "Feb", count: 61 },
  { month: "Mar", count: 64 },
  { month: "Apr", count: 66 },
  { month: "May", count: 70 },
  { month: "Jun", count: 75 },
];

const topMinistries = [
  { name: "Choir", members: 45 },
  { name: "Youth Ministry", members: 32 },
  { name: "Usher Board", members: 28 },
  { name: "Sunday School", members: 25 },
];

const eventAttendance = [
  { name: "Easter Sunrise", attendance: 120 },
  { name: "Church Anniversary", attendance: 85 },
  { name: "Spring Revival", attendance: 72 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("Last 30 Days");

  const maxGiving = Math.max(...givingData.map((d) => d.amount));
  const maxMembership = Math.max(...membershipData.map((d) => d.count));
  const maxMinistry = Math.max(...topMinistries.map((m) => m.members));
  const maxAttendance = Math.max(...eventAttendance.map((e) => e.attendance));

  const prayerTotal = MOCK_PRAYER_REQUESTS.length;
  const prayerPraying = MOCK_PRAYER_REQUESTS.filter(
    (pr) => pr.status === "praying"
  ).length;
  const prayerAnswered = MOCK_PRAYER_REQUESTS.filter(
    (pr) => pr.status === "answered"
  ).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description="Church engagement and growth metrics"
      />

      {/* Date Range Filter */}
      <FadeIn>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                dateRange === range
                  ? "bg-purple-700 text-white"
                  : "bg-warm-100 text-warm-600 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-300 dark:hover:bg-warm-700"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={MOCK_PROFILES.length}
          trend="+3 this month"
          trendUp
        />
        <StatCard
          icon={DollarSign}
          label="Total Donations"
          value="$900"
          trend="+12% vs last month"
          trendUp
        />
        <StatCard
          icon={Calendar}
          label="Events Held"
          value={8}
          trend="2 upcoming"
        />
        <StatCard
          icon={Heart}
          label="Prayer Requests"
          value={MOCK_PRAYER_REQUESTS.length}
          trend="4 answered"
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
              <div className="flex items-end gap-3" style={{ height: 200 }}>
                {givingData.map((d) => (
                  <div
                    key={d.month}
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
                    <span className="text-xs text-warm-500">{d.month}</span>
                  </div>
                ))}
              </div>
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
                    key={d.month}
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
                    <span className="text-xs text-warm-500">{d.month}</span>
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
              <div className="space-y-4">
                {topMinistries.map((ministry, i) => (
                  <div key={ministry.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-warm-700 dark:text-warm-300">
                        {i + 1}. {ministry.name}
                      </span>
                      <span className="text-warm-500">
                        {ministry.members} members
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
            </CardContent>
          </Card>
        </FadeIn>

        {/* Event Attendance */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                Event Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventAttendance.map((event) => (
                  <div key={event.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-warm-700 dark:text-warm-300">
                        {event.name}
                      </span>
                      <span className="text-warm-500">
                        {event.attendance}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
                      <div
                        className="h-full rounded-full bg-peach-400 transition-all"
                        style={{
                          width: `${(event.attendance / maxAttendance) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
