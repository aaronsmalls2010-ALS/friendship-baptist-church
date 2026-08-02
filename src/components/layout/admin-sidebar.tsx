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
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Home,
  ScrollText,
  Tags,
  UserCog,
  ArrowLeftRight,
  Menu,
  X,
  Search,
  UsersRound,
  ClipboardCheck,
  Target,
  Receipt,
  Inbox,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { canViewFinancials } from "@/lib/auth/roles";
import type { User } from "@supabase/supabase-js";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: "finance";
};

// Grouped so a growing list of admin sections stays scannable.
const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "People",
    items: [
      { label: "Members", href: "/admin/members", icon: Users },
      { label: "Families", href: "/admin/families", icon: Home },
      { label: "Ministries", href: "/admin/ministries", icon: Church },
      { label: "Groups", href: "/admin/groups", icon: UsersRound },
      { label: "Connections", href: "/admin/connections", icon: Inbox },
      { label: "Deacons", href: "/admin/deacons", icon: Shield },
      { label: "Wards", href: "/admin/wards", icon: MapPin },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Attendance", href: "/admin/attendance", icon: ClipboardCheck },
      { label: "Events", href: "/admin/events", icon: CalendarDays },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Media", href: "/admin/media", icon: Image },
      { label: "SMS Center", href: "/admin/sms", icon: MessageSquare },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Donations", href: "/admin/donations", icon: DollarSign, roles: "finance" },
      { label: "Campaigns", href: "/admin/campaigns", icon: Target, roles: "finance" },
      { label: "Statements", href: "/admin/statements", icon: Receipt, roles: "finance" },
      { label: "Donation Types", href: "/admin/donation-types", icon: Tags, roles: "finance" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", href: "/admin/reports", icon: ClipboardList },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: UserCog },
      { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const isFinance = user ? canViewFinancials(user) : false;

  const q = query.trim().toLowerCase();
  const groups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (item.roles === "finance" && !isFinance) return false;
        if (q && !item.label.toLowerCase().includes(q)) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function NavLink({ item, showLabel }: { item: NavItem; showLabel: boolean }) {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        title={!showLabel ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-purple-800 text-gold-400"
            : "text-purple-300 hover:bg-purple-900 hover:text-white",
          !showLabel && "justify-center px-2"
        )}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {showLabel && item.label}
      </Link>
    );
  }

  // Shared nav body; `showLabels` false = desktop collapsed icon rail.
  function NavBody({ showLabels }: { showLabels: boolean }) {
    return (
      <nav className="flex-1 p-2 space-y-3 overflow-y-auto" aria-label="Admin navigation">
        {showLabels && (
          <div className="relative px-1 pb-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              aria-label="Filter admin navigation"
              className="w-full rounded-lg bg-purple-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-purple-400 outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            />
          </div>
        )}
        {groups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {showLabels && (
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-500">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} showLabel={showLabels} />
            ))}
          </div>
        ))}
      </nav>
    );
  }

  function FooterLinks({ showLabels }: { showLabels: boolean }) {
    return (
      <div className="p-2 border-t border-purple-900 space-y-0.5">
        <Link
          href="/portal"
          title={!showLabels ? "Member Portal" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:text-white hover:bg-purple-900 w-full transition-colors",
            !showLabels && "justify-center px-2"
          )}
        >
          <ArrowLeftRight className="h-[18px] w-[18px] shrink-0" />
          {showLabels && "Member Portal"}
        </Link>
        <Link
          href="/"
          title={!showLabels ? "Back to Website" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:text-white hover:bg-purple-900 w-full transition-colors",
            !showLabels && "justify-center px-2"
          )}
        >
          <Globe className="h-[18px] w-[18px] shrink-0" />
          {showLabels && "Back to Website"}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:text-red-400 hover:bg-purple-900 w-full transition-colors",
            !showLabels && "justify-center px-2"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {showLabels && "Sign Out"}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex bg-purple-950 text-white h-screen sticky top-0 flex-col transition-all duration-300",
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
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <NavBody showLabels={!collapsed} />
        <FooterLinks showLabels={!collapsed} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-purple-950 text-white flex items-center justify-between px-4 border-b border-purple-900">
        <Logo variant="icon" size="sm" darkBg />
        <span className="text-xs uppercase tracking-wider text-purple-400">Admin</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-purple-900 transition-colors"
          aria-label="Open admin menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile full-screen drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 bg-purple-950 text-white flex flex-col transition-opacity duration-200",
          mobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <div className="p-4 flex items-center justify-between border-b border-purple-900">
          <Logo variant="icon" size="sm" darkBg />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-purple-900 transition-colors"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavBody showLabels={true} />
        <FooterLinks showLabels={true} />
      </div>
    </>
  );
}
