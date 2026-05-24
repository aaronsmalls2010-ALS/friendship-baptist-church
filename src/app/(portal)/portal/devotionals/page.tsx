"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Heart,
  Loader2,
  Sparkles,
  HandHeart,
  Church,
  Flame,
  Music,
} from "lucide-react";
import type { Devotional, DevotionalCategory } from "@/types";

const CATEGORY_CONFIG: Record<
  DevotionalCategory,
  { label: string; color: string; bgColor: string; icon: typeof Sparkles }
> = {
  spiritual_growth: {
    label: "Spiritual Growth",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: Sparkles,
  },
  emotional_encouragement: {
    label: "Emotional Encouragement",
    color: "text-peach-700",
    bgColor: "bg-peach-100",
    icon: HandHeart,
  },
  faith: {
    label: "Faith",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    icon: Church,
  },
  love: {
    label: "Love",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: Flame,
  },
  worship: {
    label: "Worship",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Music,
  },
};

const CATEGORIES: DevotionalCategory[] = [
  "spiritual_growth",
  "emotional_encouragement",
  "faith",
  "love",
  "worship",
];

export default function DevotionalsPage() {
  const [loading, setLoading] = useState(true);
  const [dailyDevotionals, setDailyDevotionals] = useState<Devotional[]>([]);
  const [allDevotionals, setAllDevotionals] = useState<Devotional[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<
    DevotionalCategory | "all"
  >("all");
  const [showBrowse, setShowBrowse] = useState(false);

  useEffect(() => {
    async function fetchDevotionals() {
      try {
        // Fetch daily picks
        const res = await fetch("/api/portal/devotionals?mode=daily");
        if (res.ok) {
          const data = await res.json();
          setDailyDevotionals(data.daily || []);
          setAllDevotionals(data.devotionals || []);
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

  const filteredDevotionals =
    selectedCategory === "all"
      ? allDevotionals.filter(
          (d) => !dailyDevotionals.some((dd) => dd.id === d.id)
        )
      : allDevotionals.filter(
          (d) =>
            d.category === selectedCategory &&
            !dailyDevotionals.some((dd) => dd.id === d.id)
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

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

      {/* Daily Devotionals — 2 cards side by side */}
      {dailyDevotionals.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-warm-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-500" />
              Today&apos;s Devotionals
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dailyDevotionals.map((devotional, index) => {
                const catConfig =
                  CATEGORY_CONFIG[
                    devotional.category as DevotionalCategory
                  ] || CATEGORY_CONFIG.spiritual_growth;
                const CatIcon = catConfig.icon;
                const isSaved = savedIds.has(devotional.id);

                return (
                  <FadeIn key={devotional.id} delay={0.15 + index * 0.1}>
                    <div className="relative bg-purple-50 rounded-2xl p-6 lg:p-8 border border-purple-100 h-full">
                      {/* Save button */}
                      <button
                        onClick={() => toggleSaved(devotional.id)}
                        className={`absolute top-4 right-4 transition-colors ${
                          isSaved
                            ? "text-red-500 hover:text-red-600"
                            : "text-warm-300 hover:text-red-500"
                        }`}
                        aria-label={
                          isSaved ? "Unsave devotional" : "Save devotional"
                        }
                      >
                        <Heart
                          className="h-5 w-5"
                          fill={isSaved ? "currentColor" : "none"}
                        />
                      </button>

                      <div className="space-y-4 pr-8">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${catConfig.bgColor} ${catConfig.color} border-0 text-xs`}
                          >
                            <CatIcon className="h-3 w-3 mr-1" />
                            {catConfig.label}
                          </Badge>
                        </div>

                        <h3 className="font-heading text-fluid-xl font-bold text-warm-900">
                          {devotional.title}
                        </h3>

                        <p className="text-purple-700 italic font-medium">
                          {devotional.scripture}
                        </p>

                        <blockquote className="font-scripture italic text-lg text-warm-700 border-l-4 border-purple-300 pl-4">
                          {devotional.scripture_text}
                        </blockquote>

                        <div className="space-y-3 text-warm-700 leading-relaxed">
                          {devotional.body
                            .split("\n")
                            .map((paragraph: string, i: number) => (
                              <p key={i}>{paragraph}</p>
                            ))}
                        </div>

                        <p className="text-sm text-warm-500 pt-2">
                          &mdash; {devotional.author}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Browse All Devotionals Toggle */}
      <FadeIn delay={0.3}>
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowBrowse(!showBrowse)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {showBrowse ? "Hide" : "Browse"} All Devotionals (
            {allDevotionals.length})
          </Button>
        </div>
      </FadeIn>

      {/* Browse Section */}
      {showBrowse && (
        <FadeIn delay={0.1}>
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={
                  selectedCategory === "all"
                    ? "bg-purple-700 hover:bg-purple-800"
                    : ""
                }
              >
                All Categories
              </Button>
              {CATEGORIES.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={
                      selectedCategory === cat
                        ? "bg-purple-700 hover:bg-purple-800"
                        : ""
                    }
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Devotional Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDevotionals.slice(0, 20).map((devotional, index) => {
                const isExpanded = expandedId === devotional.id;
                const isSaved = savedIds.has(devotional.id);
                const catConfig =
                  CATEGORY_CONFIG[
                    devotional.category as DevotionalCategory
                  ] || CATEGORY_CONFIG.spiritual_growth;
                const CatIcon = catConfig.icon;

                return (
                  <FadeIn key={devotional.id} delay={0.05 + index * 0.03}>
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative border border-warm-100">
                      <button
                        onClick={() => toggleSaved(devotional.id)}
                        className={`absolute top-4 right-4 transition-colors ${
                          isSaved
                            ? "text-red-500 hover:text-red-600"
                            : "text-warm-300 hover:text-red-500"
                        }`}
                        aria-label={
                          isSaved ? "Unsave devotional" : "Save devotional"
                        }
                      >
                        <Heart
                          className="h-5 w-5"
                          fill={isSaved ? "currentColor" : "none"}
                        />
                      </button>

                      <div className="space-y-2 pr-8">
                        {/* Category Badge */}
                        <Badge
                          className={`${catConfig.bgColor} ${catConfig.color} border-0 text-xs`}
                        >
                          <CatIcon className="h-3 w-3 mr-1" />
                          {catConfig.label}
                        </Badge>

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
                          {devotional.body
                            .split("\n")
                            .map((paragraph: string, i: number) => (
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

            {filteredDevotionals.length > 20 && (
              <p className="text-center text-sm text-warm-400">
                Showing 20 of {filteredDevotionals.length} devotionals
              </p>
            )}
          </div>
        </FadeIn>
      )}

      {/* Encouragement */}
      <FadeIn delay={0.4}>
        <div className="bg-purple-50 rounded-xl p-6 lg:p-8 border border-purple-100">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-scripture italic text-purple-800 text-lg leading-relaxed">
              &ldquo;Thy word is a lamp unto my feet, and a light unto my
              path.&rdquo;
            </p>
            <p className="mt-3 text-sm font-medium text-purple-600">
              &mdash; Psalm 119:105
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
