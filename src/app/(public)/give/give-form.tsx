"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { FormSuccess } from "@/components/shared/form-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AMOUNT_PRESETS = [25, 50, 100, 250];

const GIVING_TYPES = [
  { value: "tithe", label: "Tithe" },
  { value: "offering", label: "Offering" },
  { value: "building_fund", label: "Building Fund" },
  { value: "mission", label: "Mission" },
  { value: "other", label: "Other" },
];

// Mirror of the server-side fee math (Stripe US nonprofit rate 2.2% + $0.30) for
// display only. The server is authoritative for the actual charged amount.
function estimateFee(giftDollars: number): number {
  const giftCents = Math.round(giftDollars * 100);
  const chargedCents = Math.ceil((giftCents + 30) / (1 - 0.022));
  return (chargedCents - giftCents) / 100;
}

export function GiveForm({ stripeConfigured }: { stripeConfigured: boolean }) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [givingType, setGivingType] = useState("tithe");
  const [coverFees, setCoverFees] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const currentAmount = customAmount || (selectedPreset ? String(selectedPreset) : "");
  const amountNum = Number(currentAmount) || 0;
  const feeEstimate = amountNum > 0 ? estimateFee(amountNum) : 0;

  function handlePresetClick(amount: number) {
    setSelectedPreset(amount);
    setCustomAmount("");
  }

  function handleCustomAmountChange(value: string) {
    setCustomAmount(value);
    if (value) setSelectedPreset(null);
  }

  // Fallback path used when the live payment rail is not yet configured: record
  // a giving intent for the office to follow up on (the prior behavior).
  async function submitIntent() {
    const res = await fetch("/api/public/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim() || "no-email@placeholder.local",
        subject: `Giving Intent: $${currentAmount} - ${givingType}`,
        type: "Giving",
        message: [
          `Amount: $${currentAmount}`,
          `Type: ${givingType}`,
          "One-time gift",
          `Donor: ${name.trim()}`,
          email.trim() ? `Email: ${email.trim()}` : "",
        ].filter(Boolean).join("\n"),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to submit");
    }
    setSubmitted(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentAmount || amountNum <= 0 || !name.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/give/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          givingType,
          coverFees,
          name: name.trim(),
          email: email.trim(),
          honeypot,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.url) {
          window.location.assign(data.url as string); // → Stripe hosted Checkout
          return;
        }
        // Bot/honeypot short-circuit returned ok with no url — treat as done.
        setSubmitted(true);
        return;
      }

      // 503 { configured:false } → rail dormant → fall back to giving intent.
      if (res.status === 503) {
        await submitIntent();
        return;
      }

      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to start your gift.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSelectedPreset(null);
    setCustomAmount("");
    setGivingType("tithe");
    setCoverFees(false);
    setName("");
    setEmail("");
    setSubmitted(false);
    setSubmitError("");
  }

  return (
    <FadeIn delay={0.2}>
      {submitted ? (
        <FormSuccess
          message={`Thank you for your generous intent to give $${currentAmount}. The church office will follow up with you to arrange payment. God bless your generosity!`}
          onReset={handleReset}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl rounded-2xl border border-warm-100 bg-white p-6 shadow-sm dark:border-warm-800 dark:bg-warm-900 sm:p-8"
        >
          <div className="space-y-6">
            {/* Amount Presets */}
            <div className="space-y-3">
              <Label>Gift Amount</Label>
              <div className="grid grid-cols-4 gap-3">
                {AMOUNT_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetClick(amount)}
                    className={`cursor-pointer rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      selectedPreset === amount && !customAmount
                        ? "bg-purple-700 text-white shadow-md"
                        : "bg-warm-100 text-warm-700 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-300"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                inputMode="decimal"
              />
            </div>

            {/* Giving Type */}
            <div className="space-y-3">
              <Label>Giving Type</Label>
              <RadioGroup
                value={givingType}
                onValueChange={setGivingType}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {GIVING_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <RadioGroupItem value={type.value} id={`giving-${type.value}`} />
                    <Label htmlFor={`giving-${type.value}`} className="cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Cover fees */}
            <div className="flex items-start gap-3 rounded-xl bg-warm-50 p-4 dark:bg-warm-800/50">
              <Checkbox
                id="cover-fees"
                checked={coverFees}
                onCheckedChange={(v) => setCoverFees(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="cover-fees" className="cursor-pointer text-sm font-normal leading-relaxed text-warm-700 dark:text-warm-300">
                Add{feeEstimate > 0 ? ` $${feeEstimate.toFixed(2)}` : ""} to cover card processing fees, so 100% of my
                gift reaches the church.
              </Label>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="give-name">Your Name</Label>
              <Input
                id="give-name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="give-email">Email {stripeConfigured && <span className="text-warm-400">(for your receipt)</span>}</Label>
              <Input
                id="give-email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Honeypot — hidden from humans, catches naive bots */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label htmlFor="give-company">Company</label>
              <input
                id="give-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Submit */}
            {submitError && (
              <p className="text-sm text-red-600" role="alert">{submitError}</p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full cursor-pointer bg-gold-500 text-warm-900 hover:bg-gold-400 font-semibold"
              disabled={submitting}
            >
              <Heart className="mr-2 h-5 w-5" />
              {submitting ? "Processing..." : stripeConfigured ? "Continue to Secure Checkout" : "Give Now"}
            </Button>
            <p className="text-center text-xs text-warm-500">
              {stripeConfigured
                ? "You'll be redirected to our secure payment page to complete your gift by card. The church never sees your card details."
                : "This records your giving intent. The church office will follow up to arrange payment."}
            </p>
          </div>
        </form>
      )}
    </FadeIn>
  );
}
