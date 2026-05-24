"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { BookOpen, Bookmark, Heart, Loader2 } from "lucide-react";

export default function DevotionalsPage() {
  const [loading, setLoading] = useState(true);
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [bookmarkedToday, setBookmarkedToday] = useState(false);

  useEffect(() => {
    async function fetchDevotionals() {
      try {
        const res = await fetch("/api/portal/devotionals");
        if (res.ok) {
          const data = await res.json();
          setDevotionals(data.devotionals || []);
        }
      } catch (error) {
        console.error("Failed to fetch devotionals:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDevotionals();
  }, []);

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const todayDevotional = devotionals[0];
  const previousDevotionals = devotionals.slice(1);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <FadeIn>
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="font-heading text-fluid-3xl font-bold text-warm-900">
              Daily Devotionals
            </h1>
            <p className="text-warm-500 mt-1">
              Start each day with God&apos;s Word
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Today's Devotional */}
      {todayDevotional && (
        <FadeIn delay={0.1}>
          <div className="relative bg-purple-50 rounded-2xl p-8">
            <button
              onClick={() => setBookmarkedToday(!bookmarkedToday)}
              className="absolute top-6 right-6 text-purple-400 hover:text-purple-700 transition-colors"
              aria-label={bookmarkedToday ? "Remove bookmark" : "Bookmark this devotional"}
            >
              <Bookmark
                className="h-6 w-6"
                fill={bookmarkedToday ? "currentColor" : "none"}
              />
            </button>

            <div className="space-y-4 max-w-3xl">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-purple-500">
                Today&apos;s Devotional
              </span>

              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900">
                {todayDevotional.title}
              </h2>

              <p className="text-purple-700 italic font-medium">
                {todayDevotional.scripture}
              </p>

              <blockquote className="font-scripture italic text-lg text-warm-700 border-l-4 border-purple-300 pl-4">
                {todayDevotional.scripture_text}
              </blockquote>

              <div className="space-y-3 text-warm-700 leading-relaxed">
                {todayDevotional.body.split("\n").map((paragraph: string, i: number) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <p className="text-sm text-warm-500 pt-2">
                &mdash; {todayDevotional.author}
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Previous Devotionals */}
      <FadeIn delay={0.2}>
        <h2 className="font-heading text-xl font-semibold text-warm-900 mb-4">
          Previous Devotionals
        </h2>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {previousDevotionals.map((devotional, index) => {
          const isExpanded = expandedId === devotional.id;
          const isSaved = savedIds.has(devotional.id);

          return (
            <FadeIn key={devotional.id} delay={0.15 + index * 0.05}>
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                <button
                  onClick={() => toggleSaved(devotional.id)}
                  className={`absolute top-4 right-4 transition-colors ${
                    isSaved
                      ? "text-red-500 hover:text-red-600"
                      : "text-warm-300 hover:text-red-500"
                  }`}
                  aria-label={isSaved ? "Unsave devotional" : "Save devotional"}
                >
                  <Heart
                    className="h-5 w-5"
                    fill={isSaved ? "currentColor" : "none"}
                  />
                </button>

                <div className="space-y-2 pr-8">
                  <h3 className="font-heading text-lg font-bold text-warm-900">
                    {devotional.title}
                  </h3>
                  <p className="text-sm text-purple-600 font-medium">
                    {devotional.scripture}
                  </p>
                  <p className="text-xs text-warm-400">
                    {formatDate(devotional.date)}
                  </p>

                  <div
                    className={
                      isExpanded
                        ? "text-warm-600 leading-relaxed"
                        : "text-warm-600 leading-relaxed line-clamp-3"
                    }
                  >
                    {devotional.body.split("\n").map((paragraph: string, i: number) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-warm-400">
                      &mdash; {devotional.author}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(devotional.id)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      {isExpanded ? "Show Less" : "Read More"}
                    </Button>
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
