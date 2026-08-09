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
  Images,
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
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
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
      { label: "Photos", href: "/admin/photos", icon: Images },
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

// ── Module-level presentational components ──────────────────────────────
// These MUST live outside AdminSidebar. If they were nested inside it, React
// would treat them as new component types on every re-render (e.g. on route
// change) and REMOUNT the scrollable <nav>, resetting its scroll to the top.

function NavLink({
  item,
  showLabel,
  active,
  badge = 0,
}: {
  item: NavItem;
  showLabel: boolean;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      title={!showLabel ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
        active
          ? "bg-white/10 text-white"
          : "text-purple-200/70 hover:bg-white/5 hover:text-white",
        !showLabel && "justify-center px-2"
      )}
    >
      {active && showLabel && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold-400" />
      )}
      <item.icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active ? "text-gold-400" : "text-purple-300/70 group-hover:text-white"
        )}
      />
      {showLabel && item.label}
      {badge > 0 &&
        (showLabel ? (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white tabular-nums">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
        ))}
    </Link>
  );
}

function NavBody({
  showLabels,
  groups,
  query,
  setQuery,
  pathname,
  pendingPhotos,
}: {
  showLabels: boolean;
  groups: NavGroup[];
  query: string;
  setQuery: (v: string) => void;
  pathname: string;
  pendingPhotos: number;
}) {
  return (
    <nav
      className="nav-scroll flex-1 overflow-y-auto px-3 py-3 space-y-4"
      aria-label="Admin navigation"
    >
      {showLabels && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300/60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Filter admin navigation"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-purple-300/50 outline-none transition-colors focus-visible:border-gold-400/60 focus-visible:ring-1 focus-visible:ring-gold-400/40"
          />
        </div>
      )}
      {groups.map((group) => (
        <div key={group.title} className="space-y-1">
          {showLabels && (
            <p className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-purple-300/45">
              {group.title}
            </p>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              showLabel={showLabels}
              active={pathname === item.href}
              badge={item.href === "/admin/photos" ? pendingPhotos : 0}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function FooterLinks({
  showLabels,
  onSignOut,
}: {
  showLabels: boolean;
  onSignOut: () => void;
}) {
  const cls = (extra?: string) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-purple-200/60 transition-colors hover:bg-white/5 hover:text-white",
      !showLabels && "justify-center px-2",
      extra
    );
  return (
    <div className="space-y-0.5 border-t border-white/10 p-3">
      <Link href="/portal" title={!showLabels ? "Member Portal" : undefined} className={cls()}>
        <ArrowLeftRight className="h-[18px] w-[18px] shrink-0" />
        {showLabels && "Member Portal"}
      </Link>
      <Link href="/" title={!showLabels ? "Back to Website" : undefined} className={cls()}>
        <Globe className="h-[18px] w-[18px] shrink-0" />
        {showLabels && "Back to Website"}
      </Link>
      <button onClick={onSignOut} className={cls("hover:!text-red-300")}>
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        {showLabels && "Sign Out"}
      </button>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Pending photo count for the Photos nav badge (refreshes on route change).
  useEffect(() => {
    fetch("/api/admin/approvals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPendingPhotos(d.photos ?? 0))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen flex-col bg-gradient-to-b from-[#1a1030] to-[#0f0a1f] text-white shadow-xl transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && <Logo variant="icon" size="sm" darkBg />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-purple-200/70 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <NavBody
          showLabels={!collapsed}
          groups={groups}
          query={query}
          setQuery={setQuery}
          pathname={pathname}
          pendingPhotos={pendingPhotos}
        />
        <FooterLinks showLabels={!collapsed} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#140c26] px-4 text-white lg:hidden">
        <Logo variant="icon" size="sm" darkBg />
        <span className="text-xs uppercase tracking-[0.14em] text-purple-300/60">Admin</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 transition-colors hover:bg-white/5"
          aria-label="Open admin menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile full-screen drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1030] to-[#0f0a1f] text-white transition-opacity duration-200 lg:hidden",
          mobileOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Logo variant="icon" size="sm" darkBg />
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 transition-colors hover:bg-white/5"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavBody
          showLabels={true}
          groups={groups}
          query={query}
          setQuery={setQuery}
          pathname={pathname}
          pendingPhotos={pendingPhotos}
        />
        <FooterLinks showLabels={true} onSignOut={handleSignOut} />
      </div>
    </>
  );
}
