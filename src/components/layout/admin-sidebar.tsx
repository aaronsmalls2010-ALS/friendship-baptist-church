"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Church,
  Shield,
  MapPin,
  CalendarDays,
  Megaphone,
  Image,
  MessageSquare,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Ministries", href: "/admin/ministries", icon: Church },
  { label: "Deacons", href: "/admin/deacons", icon: Shield },
  { label: "Wards", href: "/admin/wards", icon: MapPin },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Media", href: "/admin/media", icon: Image },
  { label: "SMS Center", href: "/admin/sms", icon: MessageSquare },
  { label: "Donations", href: "/admin/donations", icon: DollarSign },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside
      className={cn(
        "bg-purple-950 text-white h-screen sticky top-0 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-purple-900">
        {!collapsed && <Logo variant="icon" size="sm" darkBg />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-purple-900 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <p className="px-4 py-2 text-xs text-purple-400 uppercase tracking-wider">
          Admin Panel
        </p>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-800 text-gold-400"
                  : "text-purple-300 hover:bg-purple-900 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-purple-900 space-y-0.5">
        <Link
          href="/"
          title={collapsed ? "Back to Website" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:text-white hover:bg-purple-900 w-full transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <Globe className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && "Back to Website"}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:text-red-400 hover:bg-purple-900 w-full transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
