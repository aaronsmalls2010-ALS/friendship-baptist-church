"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  Heart,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Bell,
  LogOut,
  Globe,
  ArrowLeftRight,
  ChevronRight,
  ChevronLeft,
  UsersRound,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/auth/roles";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navItems = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "My Profile", href: "/portal/profile", icon: User },
  { label: "Directory", href: "/portal/directory", icon: Users },
  { label: "Groups", href: "/portal/groups", icon: UsersRound },
  { label: "Next Steps", href: "/portal/connect", icon: Sparkles },
  { label: "Giving History", href: "/portal/giving", icon: Heart },
  { label: "Events", href: "/portal/events", icon: CalendarDays },
  { label: "Devotionals", href: "/portal/devotionals", icon: BookOpen },
  { label: "Spiritual Growth", href: "/portal/growth", icon: TrendingUp },
  { label: "Notifications", href: "/portal/notifications", icon: Bell },
];

const mobileNavItems = [
  { label: "Home", href: "/portal", icon: LayoutDashboard },
  { label: "Events", href: "/portal/events", icon: CalendarDays },
  { label: "Giving", href: "/portal/giving", icon: Heart },
  { label: "Profile", href: "/portal/profile", icon: User },
  { label: "More", href: "__toggle__", icon: ChevronRight },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    fetch("/api/portal/notifications")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          const unread = (d.notifications ?? []).filter((n: { read: boolean }) => !n.read).length;
          setNotifCount(unread);
        }
      })
      .catch(() => {});
  }, []);

  // Collapse on route change (mobile UX)
  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  const showAdminLink = user ? isAdmin(user) : false;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      {/* ── Desktop sidebar (lg+): always full width ─────────────── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-warm-200 h-screen sticky top-0 flex-col shrink-0">
        <div className="p-4 border-b border-warm-200">
          <Logo variant="icon" size="sm" />
          <p className="text-xs text-warm-500 mt-2">Member Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Portal navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-warm-600 hover:bg-warm-50 hover:text-warm-900"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
                {item.label === "Notifications" && notifCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-warm-200 space-y-1">
          {showAdminLink && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:text-purple-600 hover:bg-purple-50 w-full transition-colors"
            >
              <ArrowLeftRight className="h-4.5 w-4.5" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:text-purple-600 hover:bg-purple-50 w-full transition-colors"
          >
            <Globe className="h-4.5 w-4.5" />
            Back to Website
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Tablet icon rail (md–lg): slim collapsed rail ──────── */}
      <aside className="hidden md:flex lg:hidden flex-col w-16 bg-white border-r border-warm-200 h-screen sticky top-0 shrink-0">
        <div className="p-2 py-3 border-b border-warm-200 flex justify-center">
          <Logo variant="icon" size="sm" />
        </div>

        <nav className="flex-1 py-3 px-1.5 space-y-1 overflow-y-auto" aria-label="Portal navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex items-center justify-center w-full h-10 rounded-lg transition-colors",
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-warm-500 hover:bg-warm-50 hover:text-warm-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label === "Notifications" && notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="py-2 px-1.5 border-t border-warm-200 space-y-1">
          {showAdminLink && (
            <Link href="/admin" title="Admin Panel" className="flex items-center justify-center w-full h-10 rounded-lg text-warm-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <ArrowLeftRight className="h-5 w-5" />
            </Link>
          )}
          <Link href="/" title="Back to Website" className="flex items-center justify-center w-full h-10 rounded-lg text-warm-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
            <Globe className="h-5 w-5" />
          </Link>
          <button onClick={handleSignOut} title="Sign Out" className="flex items-center justify-center w-full h-10 rounded-lg text-warm-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* ── Mobile: bottom nav bar + expandable drawer ────────── */}
      {/* Bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-warm-200" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} aria-label="Mobile navigation">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            if (item.href === "__toggle__") {
              return (
                <button
                  key="toggle"
                  onClick={() => setExpanded(!expanded)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors",
                    expanded ? "text-purple-700" : "text-warm-400"
                  )}
                >
                  <ChevronRight className={cn("h-5 w-5 transition-transform duration-200", expanded && "rotate-90")} />
                  <span className="mt-0.5">More</span>
                </button>
              );
            }
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors",
                  isActive ? "text-purple-700" : "text-warm-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-0.5">{item.label}</span>
                {item.label === "Home" && notifCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Expandable drawer overlay (mobile) */}
      {expanded && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setExpanded(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-14 inset-x-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
              <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider px-3 mb-2">All Pages</p>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-purple-50 text-purple-700"
                        : "text-warm-600 hover:bg-warm-50"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.label === "Notifications" && notifCount > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">
                        {notifCount > 99 ? "99+" : notifCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="border-t border-warm-100 mt-2 pt-2">
                {showAdminLink && (
                  <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                    <ArrowLeftRight className="h-4.5 w-4.5" />
                    Admin Panel
                  </Link>
                )}
                <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                  <Globe className="h-4.5 w-4.5" />
                  Back to Website
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors">
                  <LogOut className="h-4.5 w-4.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
