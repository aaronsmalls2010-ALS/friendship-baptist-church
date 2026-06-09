"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Plus, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface Testimony { id: string; author_name: string; content: string; date: string; photo_url?: string; }
type Toast = { message: string; type: "success" | "error" } | null;

export default function TestimoniesPage() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [submitted, setSubmitted] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    fetch("/api/portal/testimonies")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setTestimonies(d.testimonies ?? []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata as { first_name?: string; last_name?: string };
      if (meta.first_name) setAuthorName(`${meta.first_name}${meta.last_name ? " " + meta.last_name : ""}`);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/portal/testimonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_name: authorName, content }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setFormOpen(false);
      setContent("");
      showToast("Thank you! Your testimony has been submitted for review.");
    } else {
      const d = await res.json();
      showToast(d.error ?? "Failed to submit", "error");
    }
  }

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
              <Star className="h-6 w-6 text-gold-500" /> Testimonies
            </h1>
            <p className="text-warm-500 mt-1">Stories of God&apos;s faithfulness in our church family</p>
          </div>
          {!submitted && (
            <Button onClick={() => setFormOpen(!formOpen)} className="bg-purple-700 hover:bg-purple-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Share Yours
            </Button>
          )}
        </div>

        {submitted && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-300 text-sm">
            Your testimony has been submitted and will appear after review by church leadership.
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-gold-200 bg-gold-50 dark:bg-gold-900/10 dark:border-gold-800 p-5 space-y-4">
            <h2 className="font-semibold text-warm-800 dark:text-warm-200">Share Your Testimony</h2>
            <div className="space-y-2">
              <Label htmlFor="tName">Your Name</Label>
              <Input id="tName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tContent">Your Testimony *</Label>
              <Textarea id="tContent" value={content} onChange={(e) => setContent(e.target.value)}
                rows={6} placeholder="Share how God has worked in your life…" required />
            </div>
            <p className="text-xs text-warm-500">Testimonies are reviewed by church leadership before being published.</p>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !content.trim()} className="bg-purple-700 hover:bg-purple-600 text-white">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Testimony
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : testimonies.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-warm-200 mx-auto mb-3" />
            <p className="text-warm-500">No testimonies yet. Be the first to share yours.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonies.map((t) => (
              <div key={t.id} className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.author_name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-purple-600">{t.author_name[0]}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-warm-800 dark:text-warm-200">{t.author_name}</p>
                    <p className="text-xs text-warm-400">{formatDate(t.date)}</p>
                  </div>
                </div>
                <p className="text-warm-700 dark:text-warm-300 leading-relaxed whitespace-pre-wrap">{t.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
