"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Smartphone,
  Users,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type Stats = { configured: boolean; devices: number; members: number };
type Toast = { type: "success" | "error"; message: string } | null;

const TITLE_MAX = 80;
const BODY_MAX = 300;

const QUICK_LINKS = [
  { label: "Member home", value: "/portal" },
  { label: "Events", value: "/events" },
  { label: "My notifications", value: "/portal/notifications" },
  { label: "Give", value: "/give" },
  { label: "Photo gallery", value: "/gallery" },
];

/**
 * Push Center — write a notification and send it to every member who turned on
 * notifications. Sending also files an in-app notification so members who miss
 * the pop-up still find it in their portal.
 */
export default function PushCenterPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/portal");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/push");
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ configured: false, devices: 0, members: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const canSend =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    title.length <= TITLE_MAX &&
    body.length <= BODY_MAX;

  async function send(test: boolean) {
    if (!canSend) return;
    if (test) setTesting(true);
    else setSending(true);

    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim(),
          test,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed.");

      if (test) {
        setToast({
          type: data.sent > 0 ? "success" : "error",
          message:
            data.sent > 0
              ? "Test sent to your own devices."
              : "You have no devices with notifications turned on. Enable them under Member Portal → Account & Security.",
        });
      } else {
        setToast({
          type: "success",
          message: `Sent to ${data.sent} device${data.sent === 1 ? "" : "s"}. ${data.inApp} member${
            data.inApp === 1 ? "" : "s"
          } also got it in their portal.${
            data.pruned > 0 ? ` ${data.pruned} expired device(s) removed.` : ""
          }`,
        });
        setTitle("");
        setBody("");
        setUrl("/portal");
        loadStats();
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Send failed.",
      });
    } finally {
      setSending(false);
      setTesting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="alert"
          className={`fixed top-4 right-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <AdminPageHeader
        title="Push Center"
        description="Send a notification to members who turned on church notifications"
      />

      {!stats?.configured && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Push notifications are not configured. Add{" "}
            <code className="font-mono">VAPID_PUBLIC_KEY</code>,{" "}
            <code className="font-mono">VAPID_PRIVATE_KEY</code>, and{" "}
            <code className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> in the
            Vercel dashboard, then redeploy. Until then members cannot turn
            notifications on and nothing will send.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Members reachable"
          value={stats?.members ?? 0}
          icon={Users}
        />
        <StatCard
          label="Devices subscribed"
          value={stats?.devices ?? 0}
          icon={Smartphone}
        />
      </div>

      <Card className="p-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-700" />
            <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
              New Notification
            </h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-title">Title</Label>
            <Input
              id="push-title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday service moved to 10:00"
            />
            <p className="text-xs text-warm-400">
              {title.length}/{TITLE_MAX} characters — phones show roughly the first
              40.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-body">Message</Label>
            <Textarea
              id="push-body"
              value={body}
              maxLength={BODY_MAX}
              rows={3}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Because of the Homecoming program, this Sunday's worship service begins at 10:00 a.m."
            />
            <p className="text-xs text-warm-400">
              {body.length}/{BODY_MAX} characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-url">Opens this page</Label>
            <Input
              id="push-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/portal"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.value}
                  type="button"
                  onClick={() => setUrl(link.value)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors duration-200 ${
                    url === link.value
                      ? "border-purple-300 bg-purple-50 text-purple-700"
                      : "border-warm-200 text-warm-500 hover:border-purple-300 hover:text-purple-700"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-warm-400">
              Must be a path on this site, starting with a slash.
            </p>
          </div>

          {/* Live preview — what the phone will actually show. */}
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 dark:border-warm-700 dark:bg-warm-900/40">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-warm-400">
              Preview
            </p>
            <div className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-warm-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logos/fbc-icon.png"
                alt=""
                className="h-8 w-8 shrink-0 rounded"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-warm-900 dark:text-warm-50">
                  {title.trim() || "Notification title"}
                </p>
                <p className="line-clamp-2 text-sm text-warm-500">
                  {body.trim() || "Your message shows here."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={!canSend || sending || !stats?.configured}
              className="cursor-pointer bg-purple-700 text-white hover:bg-purple-600"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send to congregation
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canSend || testing || !stats?.configured}
              onClick={() => send(true)}
              className="cursor-pointer"
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              Send test to me first
            </Button>
          </div>
        </form>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Send to the congregation?
            </DialogTitle>
            <DialogDescription>
              This goes out immediately and cannot be recalled.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-warm-600 dark:text-warm-300">
            <span className="font-medium">{stats?.members ?? 0}</span> member
            {stats?.members === 1 ? "" : "s"} on{" "}
            <span className="font-medium">{stats?.devices ?? 0}</span> device
            {stats?.devices === 1 ? "" : "s"} will be notified.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => send(false)}
              disabled={sending}
              className="cursor-pointer bg-purple-700 text-white hover:bg-purple-600"
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
