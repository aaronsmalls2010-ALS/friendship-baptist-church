"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  usePushNotifications,
  type PushResultMessage,
} from "@/hooks/use-push-notifications";
import { IosInstallSteps } from "@/components/notifications/ios-install-steps";
import { Bell, BellOff, Loader2, Send, AlertCircle } from "lucide-react";

/**
 * The full notification panel on Account & Security — the page members are
 * pointed to when the quick controls elsewhere cannot finish the job (an
 * iPhone that still needs installing, a browser that blocked the prompt).
 *
 * All of the browser handshake lives in usePushNotifications so this panel, the
 * portal bell, the dashboard prompt and the public bar can never disagree about
 * whether notifications are on.
 */
export function PushToggle({
  onMessage,
}: {
  /** Surface a result through the host page's toast. */
  onMessage?: (type: "success" | "error", message: string) => void;
}) {
  const { status, enabled, busy, testing, blocked, enable, disable, sendTest } =
    usePushNotifications();
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  function report(result: PushResultMessage) {
    if (onMessage) onMessage(result.type, result.message);
    else setInlineMessage(result.message);
  }

  const heading = (
    <div className="flex items-center gap-2">
      {status === "unsupported" || status === "unconfigured" ? (
        <BellOff className="h-5 w-5 text-warm-400" />
      ) : (
        <Bell className="h-5 w-5 text-purple-700" />
      )}
      <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
        Church Notifications
      </h2>
    </div>
  );

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
          {heading}
          <p className="text-sm text-warm-500">
            On iPhone and iPad, notifications work once you add Friendship
            Baptist to your Home Screen. It takes about ten seconds:
          </p>
          <IosInstallSteps />
        </div>
      </Card>
    );
  }

  if (status === "unsupported") {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          {heading}
          <p className="text-sm text-warm-500">
            This browser does not support notifications. Try Chrome, Edge,
            Firefox, or Safari on an up-to-date device.
          </p>
        </div>
      </Card>
    );
  }

  if (status === "unconfigured") {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          {heading}
          <p className="text-sm text-warm-500">
            Notifications are not switched on for the church yet. Check back
            soon.
          </p>
        </div>
      </Card>
    );
  }

  // ── The live toggle ───────────────────────────────────────────────────────
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {heading}

        <p className="text-sm text-warm-500">
          Get a notification on this device when the church posts an
          announcement or adds an upcoming event. You choose which kinds you
          receive under{" "}
          <span className="font-medium">Profile → Notification Preferences</span>.
        </p>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-warm-200 p-4 dark:border-warm-700">
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
              onCheckedChange={async (checked) =>
                report(await (checked ? enable() : disable()))
              }
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
            onClick={async () => report(await sendTest())}
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
