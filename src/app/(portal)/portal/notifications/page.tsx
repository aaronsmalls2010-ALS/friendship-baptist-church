"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Megaphone,
  Users,
  Heart,
  Settings,
  CheckCircle,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion/fade-in";
import type { Notification } from "@/types";

const typeConfig: Record<
  Notification["type"],
  { icon: typeof Calendar; color: string; bgColor: string }
> = {
  event: { icon: Calendar, color: "text-purple-700", bgColor: "bg-purple-100" },
  announcement: {
    icon: Megaphone,
    color: "text-gold-700",
    bgColor: "bg-gold-100",
  },
  ministry: { icon: Users, color: "text-blue-700", bgColor: "bg-blue-100" },
  prayer: { icon: Heart, color: "text-peach-700", bgColor: "bg-peach-100" },
  system: { icon: Settings, color: "text-warm-600", bgColor: "bg-warm-100" },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

type TabValue = "all" | "unread" | "event" | "announcement" | "ministry";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/portal/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistically update local state
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );

    try {
      await fetch("/api/portal/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const getFilteredNotifications = (tab: TabValue): Notification[] => {
    switch (tab) {
      case "unread":
        return notifications.filter((n) => !n.is_read);
      case "event":
        return notifications.filter((n) => n.type === "event");
      case "announcement":
        return notifications.filter((n) => n.type === "announcement");
      case "ministry":
        return notifications.filter((n) => n.type === "ministry");
      default:
        return notifications;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <FadeIn direction="up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 relative">
              <Bell className="h-5 w-5 text-purple-700" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-heading font-bold text-warm-800">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-purple-700 text-white border-0">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </FadeIn>

      {/* Filter Tabs */}
      <FadeIn direction="up" delay={0.1}>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="w-full"
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="event">Events</TabsTrigger>
            <TabsTrigger value="announcement">Announcements</TabsTrigger>
            <TabsTrigger value="ministry">Ministry</TabsTrigger>
          </TabsList>

          {/* Tab content all render the same list, just with different filtering */}
          {(
            ["all", "unread", "event", "announcement", "ministry"] as const
          ).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <NotificationList
                notifications={getFilteredNotifications(tab)}
                onMarkRead={markAsRead}
              />
            </TabsContent>
          ))}
        </Tabs>
      </FadeIn>
    </div>
  );
}

function NotificationList({
  notifications,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <FadeIn direction="up">
        <div className="bg-white rounded-xl border border-warm-100 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="font-heading font-bold text-warm-800 text-lg mb-1">
            All caught up!
          </h3>
          <p className="text-warm-500 text-sm">
            You have no notifications to show here.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification, index) => {
        const config = typeConfig[notification.type];
        const IconComponent = config.icon;

        const cardInner = (
          <div
            className={`rounded-xl p-4 border transition-all cursor-pointer hover:shadow-card-hover ${
              notification.is_read
                ? "bg-white border-warm-100"
                : "bg-purple-50/30 border-purple-100"
            }`}
            onClick={() => onMarkRead(notification.id)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
              >
                <IconComponent className={`h-5 w-5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={`text-warm-800 truncate ${
                        notification.is_read
                          ? "font-medium"
                          : "font-bold"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-warm-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-warm-400 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Right side indicators */}
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    {!notification.is_read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    )}
                    {notification.action_url && (
                      <ChevronRight className="h-4 w-4 text-warm-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

        // Wrap with Link if action_url exists
        if (notification.action_url) {
          return (
            <FadeIn key={notification.id} direction="up" delay={index * 0.03}>
              <Link
                href={notification.action_url}
                onClick={() => onMarkRead(notification.id)}
                className="block"
              >
                {cardInner}
              </Link>
            </FadeIn>
          );
        }

        return (
          <FadeIn key={notification.id} direction="up" delay={index * 0.03}>
            {cardInner}
          </FadeIn>
        );
      })}
    </div>
  );
}
