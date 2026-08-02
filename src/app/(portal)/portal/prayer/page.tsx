"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Heart, HandHeart, CheckCircle, XCircle, Loader2, Plus, Lock, Globe } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface PrayerRequest {
  id: string;
  name: string;
  request: string;
  is_public: boolean;
  status: string;
  category?: string;
  created_at: string;
  profile_id: string;
  prayed_count?: number;
  has_prayed?: boolean;
}

type Toast = { message: string; type: "success" | "error" } | null;

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  praying:   "bg-blue-100 text-blue-700",
  answered:  "bg-green-100 text-green-700",
};

export default function PrayerPortalPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    const res = await fetch("/api/portal/prayer-requests");
    if (res.ok) setRequests((await res.json()).requests ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata as { first_name?: string; last_name?: string };
      if (meta.first_name) setName(`${meta.first_name}${meta.last_name ? " " + meta.last_name : ""}`);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/portal/prayer-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, request, is_public: isPublic }),
    });
    setSubmitting(false);
    if (res.ok) {
      showToast("Prayer request submitted. We are praying with you.");
      setRequest(""); setIsPublic(false); setFormOpen(false);
      load();
    } else {
      const d = await res.json();
      showToast(d.error ?? "Failed to submit", "error");
    }
  }

  const [prayingId, setPrayingId] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  async function togglePrayed(r: PrayerRequest) {
    if (prayingId) return;
    setPrayingId(r.id);
    const willPray = !r.has_prayed;
    // Optimistic update
    setRequests((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? {
              ...x,
              has_prayed: willPray,
              prayed_count: Math.max(0, (x.prayed_count ?? 0) + (willPray ? 1 : -1)),
            }
          : x
      )
    );
    try {
      const res = await fetch(`/api/portal/prayer-requests/${r.id}/prayed`, {
        method: willPray ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      // Reconcile with server-authoritative count
      setRequests((prev) =>
        prev.map((x) =>
          x.id === r.id ? { ...x, has_prayed: data.prayed, prayed_count: data.count } : x
        )
      );
    } catch {
      // Revert on failure
      setRequests((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? {
                ...x,
                has_prayed: r.has_prayed,
                prayed_count: r.prayed_count,
              }
            : x
        )
      );
      showToast("Could not update. Please try again.", "error");
    } finally {
      setPrayingId(null);
    }
  }

  async function handleMarkAnswered(r: PrayerRequest) {
    if (answeringId) return;
    setAnsweringId(r.id);
    try {
      const res = await fetch("/api/portal/prayer-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, status: "answered" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRequests((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, status: "answered" } : x))
      );
      showToast("Marked as answered. Praise God!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setAnsweringId(null);
    }
  }

  const myRequests = requests.filter((r) => r.profile_id === user?.id);
  const communityRequests = requests.filter((r) => r.profile_id !== user?.id && r.is_public);

  return (
    <FadeIn>
      <div className="space-y-8 px-4 py-6 max-w-2xl mx-auto">
        {toast && (
          <div role="alert" className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg border ${
            toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
              <Heart className="h-6 w-6 text-purple-500" /> Prayer Requests
            </h1>
            <p className="text-warm-500 mt-1">Submit a request or pray for others in our community</p>
          </div>
          <Button onClick={() => setFormOpen(!formOpen)} className="bg-purple-700 hover:bg-purple-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> Request Prayer
          </Button>
        </div>

        {formOpen && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 p-5 space-y-4">
            <h2 className="font-semibold text-warm-800 dark:text-warm-200">Submit a Prayer Request</h2>
            <div className="space-y-2">
              <Label htmlFor="pName">Your Name</Label>
              <Input id="pName" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pRequest">Prayer Request *</Label>
              <Textarea id="pRequest" value={request} onChange={(e) => setRequest(e.target.value)}
                rows={4} placeholder="Share your prayer request…" required />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-purple-200 dark:border-purple-700 p-3">
              <div className="flex items-center gap-2">
                {isPublic ? <Globe className="h-4 w-4 text-purple-600" /> : <Lock className="h-4 w-4 text-warm-400" />}
                <div>
                  <p className="text-sm font-medium text-warm-800 dark:text-warm-200">
                    {isPublic ? "Visible to congregation" : "Private (staff only)"}
                  </p>
                  <p className="text-xs text-warm-500">Share with the church community for corporate prayer</p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !request.trim()} className="bg-purple-700 hover:bg-purple-600 text-white">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Request
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {myRequests.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-warm-800 dark:text-warm-200">My Requests</h2>
                {myRequests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed">{r.request}</p>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-warm-100 text-warm-600"}`}>
                          {r.status}
                        </span>
                        {r.is_public
                          ? <span className="text-xs text-warm-400 flex items-center gap-1"><Globe className="h-3 w-3" />Public</span>
                          : <span className="text-xs text-warm-400 flex items-center gap-1"><Lock className="h-3 w-3" />Private</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-warm-400">{formatDate(r.created_at)}</p>
                      {r.status !== "answered" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                          onClick={() => handleMarkAnswered(r)}
                          disabled={answeringId === r.id}
                        >
                          {answeringId === r.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Mark as answered
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {communityRequests.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-warm-800 dark:text-warm-200">Community Prayer Wall</h2>
                <p className="text-sm text-warm-500">Pray for your fellow church family</p>
                {communityRequests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-4 space-y-2">
                    <p className="text-sm font-medium text-warm-700 dark:text-warm-300">{r.name}</p>
                    <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">{r.request}</p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-warm-400">{formatDate(r.created_at)}</p>
                      <Button
                        variant={r.has_prayed ? "default" : "outline"}
                        size="sm"
                        className={`h-8 text-xs ${
                          r.has_prayed
                            ? "bg-purple-700 hover:bg-purple-600 text-white"
                            : "text-purple-700 border-purple-200 hover:bg-purple-50"
                        }`}
                        onClick={() => togglePrayed(r)}
                        disabled={prayingId === r.id}
                        aria-pressed={r.has_prayed ?? false}
                        aria-label={r.has_prayed ? "You prayed for this — tap to undo" : "I prayed for this"}
                      >
                        {prayingId === r.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <HandHeart className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {r.has_prayed ? "Prayed" : "I prayed"}
                        {(r.prayed_count ?? 0) > 0 && (
                          <span className="ml-1.5 tabular-nums opacity-80">{r.prayed_count}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {myRequests.length === 0 && communityRequests.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-warm-200 mx-auto mb-3" />
                <p className="text-warm-500">No prayer requests yet. Be the first to submit one.</p>
              </div>
            )}
          </>
        )}
      </div>
    </FadeIn>
  );
}
