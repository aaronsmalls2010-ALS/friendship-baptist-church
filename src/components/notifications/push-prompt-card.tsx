"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  usePushNotifications,
  type PushResultMessage,
} from "@/hooks/use-push-notifications";
import { IosInstallSteps } from "@/components/notifications/ios-install-steps";
import { BellRing, Loader2, X, CheckCircle, AlertCircle } from "lucide-react";

const DISMISS_KEY = "fbc:pushPromptDismissedAt";
const REOFFER_DAYS = 30;

/**
 * The one-time invitation on the member dashboard.
 *
 * This — not a corner icon — is what actually gets an older member to opt in:
 * it explains the benefit in a sentence, then a single large labelled button
 * fires the browser prompt. Dismissing hides it for 30 days; the bell in the
 * portal navigation remains available the whole time.
 */
export function PushPromptCard() {
  const { status, enabled, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // assume hidden until checked
  const [result, setResult] = useState<PushResultMessage | null>(null);

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

  // Hide once they're subscribed, while we're still working things out, or on
  // browsers/church setups where there is nothing to offer.
  if (
    dismissed ||
    enabled ||
    status === "loading" ||
    status === "unsupported" ||
    status === "unconfigured"
  ) {
    return null;
  }

  // Success message replaces the card body rather than vanishing, so the member
  // gets confirmation that the thing they just did worked.
  if (result?.type === "success") {
    return (
      <Card className="border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">You&apos;re all set.</p>
            <p className="mt-0.5 text-sm text-green-800">
              We&apos;ll let you know about announcements and upcoming events.
              You can turn this off any time from the bell in the menu.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 dark:border-purple-900 dark:from-purple-950/40 dark:to-transparent">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 cursor-pointer rounded-full p-1 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white">
          <BellRing className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1 pr-6">
          <h2 className="font-heading text-lg font-bold text-warm-900 dark:text-warm-50">
            Stay connected with your church family
          </h2>
          <p className="mt-1 text-sm text-warm-600 dark:text-warm-300">
            Let your phone tell you when we post an announcement or add an event
            — just like a text message. Nothing to download, and you can turn it
            off whenever you like.
          </p>

          {status === "needs-install" ? (
            <div className="mt-4 rounded-lg border border-purple-200 bg-white/70 p-4 dark:border-purple-900 dark:bg-transparent">
              <p className="mb-3 text-sm font-medium text-warm-800 dark:text-warm-100">
                On iPhone or iPad, add us to your Home Screen first:
              </p>
              <IosInstallSteps />
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="lg"
                disabled={busy}
                onClick={async () => setResult(await enable())}
                className="cursor-pointer bg-purple-700 text-white hover:bg-purple-600"
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BellRing className="mr-2 h-4 w-4" />
                )}
                Turn on notifications
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={dismiss}
                className="cursor-pointer text-warm-500"
              >
                Not right now
              </Button>
            </div>
          )}

          {result?.type === "error" && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 text-sm text-red-600"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{result.message}</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
