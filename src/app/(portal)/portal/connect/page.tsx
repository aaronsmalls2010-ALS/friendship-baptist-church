"use client";

import { useState } from "react";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Heart,
  Droplet,
  HandHelping,
  UserPlus,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from "lucide-react";

type CardType = "connect" | "salvation" | "baptism" | "prayer" | "interest";

interface StepOption {
  value: CardType;
  title: string;
  description: string;
  icon: LucideIcon;
}

const STEP_OPTIONS: StepOption[] = [
  {
    value: "connect",
    title: "I'm new here",
    description: "I'd like to connect and learn more about the church family.",
    icon: UserPlus,
  },
  {
    value: "salvation",
    title: "I made a decision for Christ",
    description: "I've decided to follow Jesus and want to take my next step.",
    icon: Sparkles,
  },
  {
    value: "baptism",
    title: "I'd like to be baptized",
    description: "I'm ready to be baptized and want to talk about it.",
    icon: Droplet,
  },
  {
    value: "prayer",
    title: "I need prayer",
    description: "I have something I'd like the prayer team to lift up.",
    icon: Heart,
  },
  {
    value: "interest",
    title: "I'm interested in serving",
    description: "I'd like to find a place to serve and get involved.",
    icon: HandHelping,
  },
];

export default function ConnectPage() {
  const [selected, setSelected] = useState<CardType | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/portal/connection-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_type: selected, message }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Something went wrong. Please try again.");
    }
  }

  function reset() {
    setSelected(null);
    setMessage("");
    setSubmitted(false);
    setError(null);
  }

  if (submitted) {
    const chosen = STEP_OPTIONS.find((o) => o.value === selected);
    return (
      <FadeIn>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-warm-900 dark:text-warm-50">
              Thank you for reaching out
            </h1>
            <p className="mt-2 text-warm-500">
              {chosen
                ? `We received your "${chosen.title}" card. `
                : "We received your card. "}
              Someone from our team will follow up with you soon.
            </p>
            <Button
              onClick={reset}
              className="mt-6 bg-purple-700 hover:bg-purple-600 text-white"
            >
              Submit another card
            </Button>
          </Card>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" /> Next Steps
          </h1>
          <p className="text-warm-500 mt-1">
            Tell us where you are in your journey and we&apos;ll walk alongside
            you. Choose the step that fits, add a note if you&apos;d like, and
            we&apos;ll follow up.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="sr-only">Choose a next step</legend>
            {STEP_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = selected === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelected(option.value)}
                  aria-pressed={isActive}
                  className={`w-full text-left cursor-pointer rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    isActive
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
                      : "border-warm-200 dark:border-warm-800 hover:border-purple-300 hover:bg-warm-50 dark:hover:bg-warm-900/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-900/40"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-warm-800 dark:text-warm-100">
                        {option.title}
                      </p>
                      <p className="text-sm text-warm-500 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-purple-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="message">Anything you&apos;d like to add? (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Share any details that would help us follow up…"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!selected || submitting}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </div>
    </FadeIn>
  );
}
