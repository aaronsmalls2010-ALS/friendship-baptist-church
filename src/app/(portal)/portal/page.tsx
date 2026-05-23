"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Heart,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  MapPin,
  Pin,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import {
  MOCK_EVENTS,
  MOCK_ANNOUNCEMENTS,
  MOCK_DONATIONS,
} from "@/lib/mock-data";

const quickActions = [
  { label: "Directory", icon: Users, href: "/portal/directory" },
  { label: "Prayer", icon: Heart, href: "/prayer" },
  { label: "Give", icon: DollarSign, href: "/give" },
  { label: "Events", icon: Calendar, href: "/portal/events" },
  { label: "Profile", icon: User, href: "/portal/profile" },
  { label: "Devotional", icon: BookOpen, href: "/portal/devotionals" },
];

// Upcoming events (future dates)
const upcomingEvents = MOCK_EVENTS
  .filter((e) => new Date(e.start_date) > new Date())
  .sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )
  .slice(0, 3);

// Giving summary
const yearToDateTotal = MOCK_DONATIONS.reduce((sum, d) => sum + d.amount, 0);
const lastDonation = MOCK_DONATIONS[0];

// Recent announcements
const recentAnnouncements = MOCK_ANNOUNCEMENTS.slice(0, 3);

const todayFormatted = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    first_name: string;
    last_name: string;
    photo_url?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/portal/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch {
        // Fall back to auth user_metadata
      }
    }
    fetchProfile();
  }, []);

  const firstName =
    profile?.first_name ||
    user?.user_metadata?.first_name ||
    "Member";
  const lastName =
    profile?.last_name ||
    user?.user_metadata?.last_name ||
    "";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <FadeIn direction="up">
        <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-purple-800 text-white p-6 lg:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-fluid-2xl font-heading font-bold">
                Welcome back, {firstName}!
              </h1>
              <p className="text-purple-200 mt-1">{todayFormatted}</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn direction="up" delay={0.1}>
        <SlideUpContainer className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <SlideUpItem key={action.label}>
              <Link href={action.href}>
                <div className="bg-white rounded-xl p-4 text-center hover:shadow-card-hover transition-shadow cursor-pointer border border-warm-100">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <action.icon className="h-5 w-5 text-purple-700" />
                  </div>
                  <span className="text-sm font-medium text-warm-700">
                    {action.label}
                  </span>
                </div>
              </Link>
            </SlideUpItem>
          ))}
        </SlideUpContainer>
      </FadeIn>

      {/* Main Grid: 2/3 + 1/3 on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events */}
          <FadeIn direction="up" delay={0.2}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-fluid-lg text-warm-800">
                  Upcoming Events
                </h2>
                <Link
                  href="/portal/events"
                  className="text-sm text-purple-700 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 pb-4 border-b border-warm-100 last:border-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-warm-800 truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-warm-500">
                        {formatDate(event.start_date)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-warm-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>

          {/* Recent Announcements */}
          <FadeIn direction="up" delay={0.3}>
            <Card className="p-6">
              <h2 className="font-heading font-bold text-fluid-lg text-warm-800 mb-4">
                Recent Announcements
              </h2>
              <div className="space-y-4">
                {recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="pb-4 border-b border-warm-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-warm-800">{ann.title}</p>
                      {ann.is_pinned && (
                        <Badge className="bg-gold-500 text-white text-[10px] px-1.5 py-0">
                          <Pin className="h-2.5 w-2.5 mr-0.5" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-warm-500 line-clamp-2">
                      {ann.body}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-6">
          {/* Giving Summary */}
          <FadeIn direction="up" delay={0.25}>
            <Card className="p-6">
              <h2 className="font-heading font-bold text-fluid-lg text-warm-800 mb-4">
                Giving Summary
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-warm-500">Year-to-Date</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${yearToDateTotal.toLocaleString()}
                  </p>
                </div>
                {lastDonation && (
                  <div>
                    <p className="text-sm text-warm-500">Last Gift</p>
                    <p className="text-warm-700 font-medium">
                      ${lastDonation.amount} on{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(lastDonation.date))}
                    </p>
                  </div>
                )}
                <Link href="/give">
                  <Button className="w-full mt-2 bg-purple-700 hover:bg-purple-800">
                    Give Now
                  </Button>
                </Link>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
