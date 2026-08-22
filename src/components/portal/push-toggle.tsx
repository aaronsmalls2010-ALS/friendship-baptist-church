"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellOff,
  Loader2,
  Send,
  Share,
  PlusSquare,
  AlertCircle,
} from "lucide-react";

/**
 * Member-facing push notification control.
 *
 * Owns the whole browser handshake: permission prompt → PushManager
 * subscription → POST to /api/portal/push. Turning it off unsubscribes the
 * browser AND deletes the row, so a member who opts out really does go quiet.
 *
 * iOS only delivers web push to a PWA that has been added to the Home Screen
 * (iOS 16.4+), so on an un-installed iPhone we show the install steps instead
 * of a toggle that could never work.
 */

type Status = "loading" | "unsupported" | "needs-install" | "unconfigured" | "ready";

/** VAPID keys travel as base64url; subscribe() wants raw bytes. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as a Mac but has a touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PushToggle({
  onMessage,
}: {
  /** Surface a result through the host page's toast. */
  onMessage?: (type: "success" | "error", message: string) => void;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  const report = useCallback(
    (type: "success" | "error", message: string) => {
      if (onMessage) onMessage(type, message);
      else setInlineMessage(message);
    },
    [onMessage]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        // On iOS the APIs are simply absent until the site is installed.
        if (typeof window !== "undefined" && isIos() && !isStandalone()) {
          if (!cancelled) setStatus("needs-install");
        } else if (!cancelled) {
          setStatus("unsupported");
        }
        return;
      }

      if (isIos() && !isStandalone()) {
        if (!cancelled) setStatus("needs-install");
        return;
      }

      try {
        const res = await fetch("/api/portal/push");
        const info = await res.json();
        if (cancelled) return;

        if (!info.configured || !info.publicKey) {
          setStatus("unconfigured");
          return;
        }
        setPublicKey(info.publicKey);

        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;

        setEnabled(Boolean(existing));
        setBlocked(Notification.permission === "denied");
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("unconfigured");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setBlocked(permission === "denied");
        report(
          "error",
          permission === "denied"
            ? "Notifications are blocked in your browser settings. Allow notifications for this site, then try again."
            : "Notification permission was not granted."
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch("/api/portal/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Do not leave the browser subscribed to a server that lost the row.
        await subscription.unsubscribe().catch(() => {});
        throw new Error(data.error || "Could not save your notification settings.");
      }

      setEnabled(true);
      setBlocked(false);
      report("success", "Notifications are on for this device.");
    } catch (err) {
      report(
        "error",
        err instanceof Error ? err.message : "Could not turn on notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/portal/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setEnabled(false);
      report("success", "Notifications are off for this device.");
    } catch {
      report("error", "Could not turn off notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/portal/push/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Test send failed.");
      report(
        data.sent > 0 ? "success" : "error",
        data.sent > 0
          ? "Test sent — it should appear in a moment."
          : "No devices received it. Try turning notifications off and on again."
      );
    } catch (err) {
      report("error", err instanceof Error ? err.message : "Test send failed.");
    } finally {
      setTesting(false);
    }
  }

  // ── States that are not a toggle ──────────────────────────────────────────
  if (status === "loading") {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking notification settings…</span>
        </div>
      </Card>
    );
  }

  if (status === "needs-install") {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-700" />
            <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
              Church Notifications
            </h2>
          </div>
          <p className="text-sm text-warm-500">
            On iPhone and iPad, notifications work once you add Friendship Baptist
            to your Home Screen. It takes about ten seconds:
          </p>
          <ol className="space-y-2 text-sm text-warm-600 dark:text-warm-300">
            <li className="flex items-start gap-2">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
              <span>
                Tap the <span className="font-semibold">Share</span> button at the
                bottom of Safari.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <PlusSquare className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
              <span>
                Choose <span className="font-semibold">Add to Home Screen</span>,
                then tap <span className="font-semibold">Add</span>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
              <span>
                Open the new Friendship Baptist icon and come back to this page to
                turn notifications on.
              </span>
            </li>
          </ol>
        </div>
      </Card>
    );
  }

  if (status === "unsupported") {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-warm-400" />
            <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
              Church Notifications
            </h2>
          </div>
          <p className="text-sm text-warm-500">
            This browser does not support notifications. Try Chrome, Edge, Firefox,
            or Safari on an up-to-date device.
          </p>
        </div>
      </Card>
    );
  }

  if (status === "unconfigured") {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-warm-400" />
            <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
              Church Notifications
            </h2>
          </div>
          <p className="text-sm text-warm-500">
            Notifications are not switched on for the church yet. Check back soon.
          </p>
        </div>
      </Card>
    );
  }

  // ── The live toggle ───────────────────────────────────────────────────────
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-700" />
          <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
            Church Notifications
          </h2>
        </div>

        <p className="text-sm text-warm-500">
          Get a notification on this device when the church posts an announcement
          or adds an upcoming event. You choose which kinds you receive under{" "}
          <span className="font-medium">Profile → Notification Preferences</span>.
        </p>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-warm-200 dark:border-warm-700 p-4">
          <div className="min-w-0">
            <Label htmlFor="push-enabled" className="cursor-pointer">
              Notifications on this device
            </Label>
            <p className="mt-0.5 text-xs text-warm-400">
              {enabled
                ? "You'll be notified on this phone or computer."
                : "Turn on to start receiving church notifications here."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin text-warm-400" />}
            <Switch
              id="push-enabled"
              checked={enabled}
              disabled={busy || blocked}
              onCheckedChange={(checked) => (checked ? enable() : disable())}
              className="cursor-pointer"
            />
          </div>
        </div>

        {blocked && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Notifications are blocked for this site in your browser settings.
              Allow them for thefriendshipbaptist.com, then reload this page.
            </span>
          </div>
        )}

        {enabled && (
          <Button
            type="button"
            variant="outline"
            onClick={sendTest}
            disabled={testing}
            className="cursor-pointer"
          >
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send me a test notification
          </Button>
        )}

        {inlineMessage && (
          <p role="status" className="text-sm text-warm-500">
            {inlineMessage}
          </p>
        )}
      </div>
    </Card>
  );
}
