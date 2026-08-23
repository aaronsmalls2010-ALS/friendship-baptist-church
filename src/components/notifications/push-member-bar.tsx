"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  usePushNotifications,
  type PushResultMessage,
} from "@/hooks/use-push-notifications";
import { BellRing, Loader2, X, CheckCircle } from "lucide-react";

const DISMISS_KEY = "fbc:pushBarDismissedAt";
const REOFFER_DAYS = 30;

/**
 * Invitation bar on the public site — shown ONLY to signed-in members who have
 * not turned notifications on yet.
 *
 * Deliberately not offered to visitors: a subscription is bound to a member
 * profile, so a logged-out visitor tapping it would hit a sign-in wall, and a
 * control that dead-ends teaches people the site is broken.
 *
 * It floats above the mobile action bar rather than sitting in the page flow,
 * because the header is fixed and the home page hero is full-screen — a banner
 * in normal flow would end up underneath one or push the other off-screen.
 */
export function PushMemberBar() {
  const { isAuthenticated, isLoading } = useAuth();
  const { status, enabled, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // assume hidden until checked
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      if (!raw) {
        setDismissed(false);
        return;
      }
      const at = Number(raw);
      const expired =
        !Number.isFinite(at) ||
        Date.now() - at > REOFFER_DAYS * 24 * 60 * 60 * 1000;
      setDismissed(!expired);
    } catch {
      // Private mode / storage blocked — just show it.
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* nothing to persist to; it will reappear next visit */
    }
  }

  async function handleEnable() {
    setError(null);
    const result: PushResultMessage = await enable();
    if (result.type === "success") {
      setDone(true);
      window.setTimeout(dismiss, 4000);
    } else {
      setError(result.message);
    }
  }

  if (
    isLoading ||
    !isAuthenticated ||
    dismissed ||
    enabled ||
    status === "loading" ||
    status === "unsupported" ||
    status === "unconfigured"
  ) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Church notifications"
      className="fixed inset-x-4 bottom-16 z-40 rounded-xl bg-purple-800 text-white shadow-2xl ring-1 ring-black/10 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:max-w-sm"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 cursor-pointer rounded-full p-1.5 text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 p-4 pr-10">
        <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />

        {done ? (
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="h-4 w-4 text-gold-300" />
            Notifications are on. We&apos;ll keep you posted.
          </p>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-semibold">Never miss a church update</p>
            <p className="mt-0.5 text-sm text-purple-100">
              Get announcements and upcoming events on this device.
            </p>

            {status === "needs-install" ? (
              // iOS cannot subscribe from Safari, so point at the page that
              // walks through adding us to the Home Screen first.
              <Link
                href="/portal/settings"
                className="mt-3 inline-flex items-center rounded-full bg-gold-400 px-4 py-1.5 text-sm font-semibold text-purple-950 transition-colors duration-200 hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                How to set it up on iPhone
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-gold-400 px-4 py-1.5 text-sm font-semibold text-purple-950 transition-colors duration-200 hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Turn on notifications
              </button>
            )}

            {error && (
              <p role="alert" className="mt-2 text-xs text-gold-200">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
