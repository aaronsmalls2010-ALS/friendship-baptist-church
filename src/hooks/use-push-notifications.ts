"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The whole browser side of web push in one place: capability detection, the
 * permission handshake, subscribe / unsubscribe, and a self-test send.
 *
 * Every surface that offers notifications (the portal bell, the dashboard
 * prompt, the settings toggle, the member bar) uses this so they can never
 * disagree about whether notifications are on.
 *
 * Statuses:
 *   loading       — still working out what this browser can do
 *   unsupported   — no service worker / PushManager (old browser, private mode)
 *   needs-install — iPhone or iPad that has not been added to the Home Screen;
 *                   iOS refuses web push outside an installed PWA (16.4+)
 *   unconfigured  — the church has not set up push yet (no VAPID keys)
 *   ready         — the toggle can be shown
 */
export type PushStatus =
  | "loading"
  | "unsupported"
  | "needs-install"
  | "unconfigured"
  | "ready";

/** VAPID keys travel as base64url; subscribe() wants raw bytes. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as a Mac but has a touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type PushResultMessage = { type: "success" | "error"; message: string };

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      // On iOS the push APIs are simply absent until the site is installed, so
      // check the install case before calling the browser unsupported.
      if (isIosDevice() && !isStandalonePwa()) {
        if (!cancelled) setStatus("needs-install");
        return;
      }
      if (!supported) {
        if (!cancelled) setStatus("unsupported");
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

  const enable = useCallback(async (): Promise<PushResultMessage> => {
    if (!publicKey) {
      return { type: "error", message: "Notifications are not available yet." };
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setBlocked(permission === "denied");
        return {
          type: "error",
          message:
            permission === "denied"
              ? "Notifications are blocked in your browser settings. Allow them for this site, then try again."
              : "Notification permission was not granted.",
        };
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
        // Never leave the browser subscribed to a server that lost the row.
        await subscription.unsubscribe().catch(() => {});
        throw new Error(data.error || "Could not save your notification settings.");
      }

      setEnabled(true);
      setBlocked(false);
      return { type: "success", message: "Notifications are on for this device." };
    } catch (err) {
      return {
        type: "error",
        message:
          err instanceof Error ? err.message : "Could not turn on notifications.",
      };
    } finally {
      setBusy(false);
    }
  }, [publicKey]);

  const disable = useCallback(async (): Promise<PushResultMessage> => {
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
      return { type: "success", message: "Notifications are off for this device." };
    } catch {
      return { type: "error", message: "Could not turn off notifications." };
    } finally {
      setBusy(false);
    }
  }, []);

  const sendTest = useCallback(async (): Promise<PushResultMessage> => {
    setTesting(true);
    try {
      const res = await fetch("/api/portal/push/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Test send failed.");
      return data.sent > 0
        ? { type: "success", message: "Test sent — it should appear in a moment." }
        : {
            type: "error",
            message:
              "No devices received it. Try turning notifications off and on again.",
          };
    } catch (err) {
      return {
        type: "error",
        message: err instanceof Error ? err.message : "Test send failed.",
      };
    } finally {
      setTesting(false);
    }
  }, []);

  return {
    status,
    enabled,
    busy,
    testing,
    blocked,
    /** True when this device can be switched on right now. */
    canToggle: status === "ready" && !blocked,
    enable,
    disable,
    sendTest,
  };
}
