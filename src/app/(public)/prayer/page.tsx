"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, CheckCircle2, HandHeart, Loader2 } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { FormSuccess } from "@/components/shared/form-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableText } from "@/components/cms/editable-text";
import type { PrayerRequest } from "@/types";

const categories = [
  "Health",
  "Family",
  "Guidance",
  "Thanksgiving",
  "Community",
  "Personal",
  "Other",
];

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-warm-500 text-white",
    icon: Clock,
  },
  praying: {
    label: "Praying",
    className: "bg-purple-600 text-white",
    icon: HandHeart,
  },
  answered: {
    label: "Answered",
    className: "bg-gold-500 text-warm-900",
    icon: CheckCircle2,
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PrayerPage() {
  const [loading, setLoading] = useState(true);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [request, setRequest] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function fetchPrayerRequests() {
    try {
      const res = await fetch("/api/public/prayer-requests");
      const data = await res.json();
      setPrayerRequests(data.prayer_requests ?? data.prayerRequests ?? []);
    } catch (err) {
      console.error("Failed to load prayer requests:", err);
    }
  }

  useEffect(() => {
    async function load() {
      await fetchPrayerRequests();
      setLoading(false);
    }
    load();
  }, []);

  const publicRequests = prayerRequests.filter((pr) => pr.is_public);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !request.trim()) return;
    try {
      await fetch("/api/public/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          category: category || undefined,
          request: request.trim(),
          is_public: isPublic,
        }),
      });
      setSubmitted(true);
      // Refetch prayer requests after successful submission
      await fetchPrayerRequests();
    } catch (err) {
      console.error("Failed to submit prayer request:", err);
    }
  }

  function handleReset() {
    setName("");
    setEmail("");
    setCategory("");
    setRequest("");
    setIsPublic(false);
    setSubmitted(false);
  }

  if (loading) {
    return (
      <>
        <PageHero
          title="Prayer Requests"
          subtitle="Bear one another's burdens, and so fulfill the law of Christ"
          breadcrumbs={[{ label: "Prayer" }]}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <PageHero
        title="Prayer Requests"
        subtitle="Bear one another's burdens, and so fulfill the law of Christ"
        breadcrumbs={[{ label: "Prayer" }]}
      />

      {/* Submit a Prayer Request */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow">
          <FadeIn>
            <div className="text-center mb-10 lg:mb-14">
              <EditableText
                id="prayer.submit.title"
                fallback="Share Your Prayer Request"
                as="h2"
                className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50"
              />
              <EditableText
                id="prayer.submit.subtitle"
                fallback="Let our prayer warriors lift you up before the Lord"
                as="p"
                className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto"
              />
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-purple mx-auto" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            {submitted ? (
              <FormSuccess
                message="Your prayer request has been received. Our prayer warriors will lift you up."
                onReset={handleReset}
              />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-2xl rounded-2xl border border-warm-100 bg-white p-6 shadow-sm dark:border-warm-800 dark:bg-warm-900 sm:p-8"
              >
                <div className="space-y-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="prayer-name">Your Name</Label>
                    <Input
                      id="prayer-name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="prayer-email">Email (optional)</Label>
                    <Input
                      id="prayer-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Request */}
                  <div className="space-y-2">
                    <Label htmlFor="prayer-request">Prayer Request</Label>
                    <Textarea
                      id="prayer-request"
                      placeholder="Share what's on your heart..."
                      rows={5}
                      className="min-h-[100px] resize-y"
                      value={request}
                      onChange={(e) => setRequest(e.target.value)}
                      required
                    />
                  </div>

                  {/* Public/Private */}
                  <div className="flex items-center gap-3">
                    <Switch
                      id="prayer-public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="prayer-public" className="cursor-pointer">
                      Make this prayer request public
                    </Label>
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full" size="lg">
                    Submit Prayer Request
                  </Button>
                </div>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Scripture Divider */}
      <ScriptureDivider
        text={
          <EditableText
            id="prayer.scripture.text"
            fallback="The prayer of a righteous person is powerful and effective."
            as="span"
          />
        }
        reference={
          <EditableText
            id="prayer.scripture.reference"
            fallback="James 5:16"
            as="span"
          />
        }
      />

      {/* Community Prayers */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <div className="text-center mb-10 lg:mb-14">
              <EditableText
                id="prayer.community.title"
                fallback="Pray With Us"
                as="h2"
                className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50"
              />
              <EditableText
                id="prayer.community.subtitle"
                fallback="Join our congregation in lifting up these prayer needs"
                as="p"
                className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto"
              />
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-purple mx-auto" />
            </div>
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {publicRequests.map((pr) => {
              const status = statusConfig[pr.status];
              const StatusIcon = status.icon;
              return (
                <SlideUpItem key={pr.id}>
                  <div className="rounded-xl border border-warm-100 bg-white p-6 dark:border-warm-800 dark:bg-warm-900">
                    {/* Header row */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-warm-900 dark:text-warm-50">
                          {pr.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-warm-500">
                          {formatDate(pr.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {pr.category && (
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {pr.category}
                          </Badge>
                        )}
                        <Badge className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Request text */}
                    <p className="leading-relaxed text-warm-600 dark:text-warm-400">
                      {pr.request}
                    </p>

                    {/* Praying indicator */}
                    <div className="mt-4 flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400">
                      <Heart className="h-4 w-4 fill-current" />
                      <span>12 praying</span>
                    </div>
                  </div>
                </SlideUpItem>
              );
            })}
          </SlideUpContainer>
        </div>
      </section>
    </>
  );
}
