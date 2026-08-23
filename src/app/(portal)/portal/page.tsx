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
  Cake,
  X,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { PushPromptCard } from "@/components/notifications/push-prompt-card";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, CHURCH_TZ } from "@/lib/utils";

const quickActions = [
  { label: "Profile", icon: User, href: "/portal/profile" },
  { label: "Events", icon: Calendar, href: "/portal/events" },
  { label: "Prayer", icon: Heart, href: "/portal/prayer" },
  { label: "Devotionals", icon: BookOpen, href: "/portal/devotionals" },
  { label: "Give", icon: DollarSign, href: "/give" },
  { label: "Directory", icon: Users, href: "/portal/directory" },
];

const todayFormatted = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: CHURCH_TZ,
}).format(new Date());

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    first_name: string;
    last_name: string;
    photo_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [yearToDateTotal, setYearToDateTotal] = useState(0);
  const [lastDonation, setLastDonation] = useState<any>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/portal/dashboard");
        if (res.ok) {
          const data = await res.json();
          setUpcomingEvents(data.events || []);
          setYearToDateTotal(data.giving?.year_to_date || 0);
          setLastDonation(data.giving?.last_donation || null);
          setRecentAnnouncements(data.announcements || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
    // Birthdays
    fetch("/api/portal/birthdays")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setBirthdays(d.birthdays ?? []); });
    // Onboarding: show if never dismissed
    const dismissed = typeof window !== "undefined" && localStorage.getItem("onboarding_dismissed");
    if (!dismissed) setShowOnboarding(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Card */}
      <FadeIn direction="up">
        <div className="rounded-xl lg:rounded-2xl bg-gradient-to-r from-purple-700 to-purple-800 text-white p-4 lg:p-8">
          <div className="flex items-center gap-3 lg:gap-4">
            {profile?.photo_url && !avatarError ? (
              <img
                src={profile.photo_url}
                alt={`${firstName} ${lastName}`}
                className="h-10 w-10 lg:h-14 lg:w-14 shrink-0 rounded-full object-cover border-2 border-white/30"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-10 w-10 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg lg:text-xl font-bold">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-lg lg:text-fluid-2xl font-heading font-bold">
                Welcome back, {firstName}!
              </h1>
              <p className="text-purple-200 text-xs lg:text-base mt-0.5 lg:mt-1">{todayFormatted}</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Notification invitation — hides itself once the member is subscribed,
          or for 30 days after they dismiss it. */}
      <PushPromptCard />

      {/* Quick Actions */}
      <FadeIn direction="up" delay={0.1}>
        <SlideUpContainer className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 lg:gap-3">
          {quickActions.map((action) => (
            <SlideUpItem key={action.label}>
              <Link href={action.href}>
                <div className="bg-white rounded-lg lg:rounded-xl p-2.5 lg:p-4 text-center hover:shadow-card-hover transition-shadow cursor-pointer border border-warm-100">
                  <div className="mx-auto mb-1 lg:mb-2 flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-purple-100">
                    <action.icon className="h-4 w-4 lg:h-5 lg:w-5 text-purple-700" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium text-warm-700">
                    {action.label}
                  </span>
                </div>
              </Link>
            </SlideUpItem>
          ))}
        </SlideUpContainer>
      </FadeIn>

      {/* Main Grid: 2/3 + 1/3 on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Upcoming Events */}
          <FadeIn direction="up" delay={0.2}>
            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-base lg:text-fluid-lg text-warm-800">
                  Upcoming Events
                </h2>
                <Link
                  href="/portal/events"
                  className="text-xs lg:text-sm text-purple-700 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 pb-3 border-b border-warm-100 last:border-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                      <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm lg:text-base font-semibold text-warm-800 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs lg:text-sm text-warm-500">
                        {formatDate(event.start_date)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-warm-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {event.location}
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
            <Card className="p-4 lg:p-6">
              <h2 className="font-heading font-bold text-base lg:text-fluid-lg text-warm-800 mb-3">
                Recent Announcements
              </h2>
              <div className="space-y-3">
                {recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="pb-3 border-b border-warm-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm lg:text-base font-bold text-warm-800">{ann.title}</p>
                      {ann.is_pinned && (
                        <Badge className="bg-gold-500 text-white text-[10px] px-1.5 py-0">
                          <Pin className="h-2.5 w-2.5 mr-0.5" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-warm-500 line-clamp-2">
                      {ann.body}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-4 lg:space-y-6">
          {/* Onboarding Checklist */}
          {showOnboarding && (
            <FadeIn direction="up" delay={0.15}>
              <Card className="p-4 border-purple-200 bg-purple-50">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-heading font-bold text-sm lg:text-base text-warm-800">Get Started</h2>
                  <button onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem("onboarding_dismissed", "1");
                  }} className="text-warm-400 hover:text-warm-600" aria-label="Dismiss">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "Complete your profile", href: "/portal/profile" },
                    { label: "Join a ministry", href: "/portal/growth" },
                    { label: "Set up giving", href: "/give" },
                    { label: "Opt in to SMS updates", href: "/portal/notifications" },
                  ].map(({ label, href }) => (
                    <Link key={label} href={href} className="flex items-center gap-2 text-xs lg:text-sm text-warm-700 hover:text-purple-700 group">
                      <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-warm-300 group-hover:text-purple-500 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}

          {/* This Week's Birthdays */}
          {birthdays.length > 0 && (
            <FadeIn direction="up" delay={0.2}>
              <Card className="p-4">
                <h2 className="font-heading font-bold text-sm lg:text-fluid-lg text-warm-800 mb-2 flex items-center gap-2">
                  <Cake className="h-4 w-4 lg:h-5 lg:w-5 text-peach-500" /> Birthdays This Week
                </h2>
                <div className="space-y-1.5">
                  {birthdays.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-2">
                      {b.photo_url ? (
                        <img src={b.photo_url} alt={b.first_name} className="h-7 w-7 lg:h-8 lg:w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-peach-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] lg:text-xs font-bold text-peach-600">{b.first_name?.[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-warm-800">{b.first_name} {b.last_name}</p>
                        <p className="text-[10px] lg:text-xs text-warm-400">
                          {new Date((b.date_of_birth || b.birthday) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}

          {/* Giving Summary */}
          <FadeIn direction="up" delay={0.25}>
            <Card className="p-4 lg:p-6">
              <h2 className="font-heading font-bold text-sm lg:text-fluid-lg text-warm-800 mb-3">
                Giving Summary
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs lg:text-sm text-warm-500">Year-to-Date</p>
                  <p className="text-xl lg:text-2xl font-bold text-purple-700">
                    ${yearToDateTotal.toLocaleString()}
                  </p>
                </div>
                {lastDonation && (
                  <div>
                    <p className="text-xs lg:text-sm text-warm-500">Last Gift</p>
                    <p className="text-sm text-warm-700 font-medium">
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
                  <Button className="w-full mt-1 bg-purple-700 hover:bg-purple-800 text-sm">
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
