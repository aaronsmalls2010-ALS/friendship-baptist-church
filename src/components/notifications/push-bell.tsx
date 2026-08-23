"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePushNotifications,
  type PushResultMessage,
} from "@/hooks/use-push-notifications";
import { IosInstallSteps } from "@/components/notifications/ios-install-steps";
import { cn } from "@/lib/utils";
import { Bell, BellOff, BellRing, Loader2, Send, AlertCircle, CheckCircle } from "lucide-react";

/**
 * The always-visible notification control in the portal shell.
 *
 * Deliberately NOT a bare switch. Tapping the bell opens a short plain-language
 * explainer, and only a second, labelled tap inside it fires the browser
 * permission prompt. A cold prompt gets denied, and a denial is permanent and
 * hard for an older member to undo — so the explanation comes first, every time.
 */
export function PushBell({
  variant = "row",
  className,
}: {
  /** "row" = full-width sidebar row · "icon" = square icon button for the rail */
  variant?: "row" | "icon";
  className?: string;
}) {
  const { status, enabled, busy, testing, blocked, enable, disable, sendTest } =
    usePushNotifications();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<PushResultMessage | null>(null);

  // Nothing to offer on a browser that cannot do this at all, or before the
  // church has switched push on.
  if (status === "loading" || status === "unsupported" || status === "unconfigured") {
    return null;
  }

  const on = enabled && !blocked;
  const Icon = blocked ? BellOff : on ? BellRing : Bell;

  async function run(action: () => Promise<PushResultMessage>) {
    setResult(await action());
  }

  const label = blocked ? "Notifications blocked" : on ? "Notifications on" : "Notifications off";

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={label}
          aria-label={label}
          className={cn(
            "relative flex h-10 w-full cursor-pointer items-center justify-center rounded-lg transition-colors",
            on
              ? "text-purple-700 hover:bg-purple-50"
              : "text-warm-500 hover:bg-warm-50 hover:text-warm-900",
            className
          )}
        >
          <Icon className="h-5 w-5" />
          <span
            className={cn(
              "absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white",
              on ? "bg-green-500" : "bg-warm-300"
            )}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            on
              ? "text-purple-700 hover:bg-purple-50"
              : "text-warm-600 hover:bg-warm-50 hover:text-warm-900",
            className
          )}
          aria-label={label}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          <span>Notifications</span>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              blocked
                ? "bg-amber-100 text-amber-700"
                : on
                  ? "bg-green-100 text-green-700"
                  : "bg-warm-100 text-warm-500"
            )}
          >
            {blocked ? "Blocked" : on ? "On" : "Off"}
          </span>
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setResult(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl">
              <Bell className="h-5 w-5 text-purple-700" />
              Church Notifications
            </DialogTitle>
          </DialogHeader>

          {status === "needs-install" ? (
            <div className="space-y-3">
              <p className="text-sm text-warm-500">
                On an iPhone or iPad, notifications work once Friendship Baptist
                is on your Home Screen. It takes about ten seconds:
              </p>
              <IosInstallSteps />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-warm-600 dark:text-warm-300">
                Turn this on and your phone will let you know when the church
                posts an announcement or adds an upcoming event — the same way a
                text message arrives. No app to download, and you can turn it off
                here any time.
              </p>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-warm-200 p-4 dark:border-warm-700">
                <div className="min-w-0">
                  <Label htmlFor="push-bell-switch" className="cursor-pointer">
                    Notify me on this device
                  </Label>
                  <p className="mt-0.5 text-xs text-warm-400">
                    {on
                      ? "You'll be notified on this phone or computer."
                      : "Your browser will ask you to allow notifications."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-warm-400" />}
                  <Switch
                    id="push-bell-switch"
                    checked={on}
                    disabled={busy || blocked}
                    onCheckedChange={(checked) =>
                      run(checked ? enable : disable)
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
                    Notifications are blocked for this site in your browser
                    settings. Allow them for thefriendshipbaptist.com, then
                    reload this page.
                  </span>
                </div>
              )}

              {on && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => run(sendTest)}
                  disabled={testing}
                  className="w-full cursor-pointer"
                >
                  {testing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send me a test notification
                </Button>
              )}

              {result && (
                <p
                  role="status"
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    result.type === "success" ? "text-green-700" : "text-red-600"
                  )}
                >
                  {result.type === "success" ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{result.message}</span>
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
