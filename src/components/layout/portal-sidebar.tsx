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
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Directory", href: "/portal/directory", icon: Users },
  { label: "My Profile", href: "/portal/profile", icon: User },
  { label: "Giving History", href: "/portal/giving", icon: Heart },
  { label: "Events", href: "/portal/events", icon: CalendarDays },
  { label: "Devotionals", href: "/portal/devotionals", icon: BookOpen },
  { label: "Spiritual Growth", href: "/portal/growth", icon: TrendingUp },
  { label: "Notifications", href: "/portal/notifications", icon: Bell },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside className="w-64 bg-white dark:bg-warm-900 border-r border-warm-200 dark:border-warm-800 h-screen sticky top-0 flex flex-col">
      <div className="p-4 border-b border-warm-200 dark:border-warm-800">
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
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-warm-600 hover:bg-warm-50 hover:text-warm-900 dark:text-warm-400 dark:hover:bg-warm-800"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-warm-200 dark:border-warm-800 space-y-1">
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
  );
}
