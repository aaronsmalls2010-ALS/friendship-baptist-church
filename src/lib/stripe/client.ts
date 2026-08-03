import Stripe from "stripe";

/**
 * Server-only Stripe helpers for online giving.
 *
 * Architecture (per the IWC Stripe playbook): we use Stripe-hosted Checkout, so
 * the card field lives in Stripe's iframe — we stay PCI SAQ-A and never need a
 * publishable key server-side. The webhook is the source of truth for recording
 * a donation; the Checkout redirect is just UX.
 *
 * NOTHING here throws at import time. When STRIPE_SECRET_KEY is absent (the
 * current "dormant until the church's Stripe account exists" state) the rail
 * simply reports itself unconfigured and the /give page falls back to recording
 * a giving intent. Flipping it live = set the env vars in Vercel + redeploy.
 */

let cached: Stripe | null = null;

/** True once a Stripe secret key is present in the environment. */
export function isStripeConfigured(): boolean {
  return Boolean(cleanKey(process.env.STRIPE_SECRET_KEY));
}

/**
 * Lazily construct the Stripe client. Returns null (never throws) when no key is
 * configured, so callers can degrade gracefully. Strips a stray BOM/whitespace
 * that copy-paste into Vercel env vars notoriously introduces.
 */
export function getStripe(): Stripe | null {
  if (cached) return cached;
  const key = cleanKey(process.env.STRIPE_SECRET_KEY);
  if (!key) return null;
  // Omit apiVersion so we inherit the version pinned to the installed SDK,
  // avoiding a brittle string-literal that breaks the type-check on SDK bumps.
  cached = new Stripe(key);
  return cached;
}

function cleanKey(raw: string | undefined): string {
  if (!raw) return "";
  // Strip a leading BOM (U+FEFF) + surrounding whitespace — the classic env-var
  // paste hazard that otherwise yields silent auth failures.
  return raw.replace(new RegExp("^" + String.fromCharCode(0xfeff)), "").trim();
}

// ─── Giving types ──────────────────────────────────────────────────────────
//
// The public /give form uses hyphenated values; the DB donation_types.slug and
// the donation_type enum use underscores. Normalize at the boundary so metadata
// always carries the canonical slug the webhook can look up.

export const GIVING_TYPE_SLUGS = [
  "tithe",
  "offering",
  "building_fund",
  "mission",
  "other",
] as const;

export type GivingTypeSlug = (typeof GIVING_TYPE_SLUGS)[number];

/** "building-fund" | "Building Fund" -> "building_fund"; unknown -> "offering". */
export function normalizeGivingType(value: string | null | undefined): GivingTypeSlug {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (GIVING_TYPE_SLUGS as readonly string[]).includes(slug)
    ? (slug as GivingTypeSlug)
    : "offering";
}

// ─── Fee-coverage math ───────────────────────────────────────────────────────
//
// Donors may opt to "cover the processing fee" so 100% of their intended gift
// reaches the church. We gross the amount up so that AFTER Stripe deducts its
// fee from the charged total, the church nets the original gift amount.
//
//   charged = (gift + fixed) / (1 - percent)
//
// Defaults reflect Stripe's US nonprofit rate (2.2% + $0.30). Overridable via
// env in case the church negotiates a different rate, without a code change.

const FEE_PERCENT = numFromEnv(process.env.STRIPE_FEE_PERCENT, 0.022); // 2.2%
const FEE_FIXED_CENTS = Math.round(numFromEnv(process.env.STRIPE_FEE_FIXED, 0.3) * 100); // 30¢

function numFromEnv(raw: string | undefined, fallback: number): number {
  const n = Number(String(raw ?? "").trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export interface ChargeBreakdown {
  /** The donor's intended gift, in cents — what the church records + nets. */
  giftCents: number;
  /** The fee the donor is covering, in cents (0 when not covering). */
  feeCents: number;
  /** What Stripe actually charges the card, in cents. */
  chargedCents: number;
}

/**
 * Given a gift amount in dollars and whether the donor is covering fees, return
 * the cent breakdown. When covering, `chargedCents` is grossed up so the church
 * nets `giftCents`. When not, the donor is charged exactly the gift and the
 * church nets gift minus fee (fee not modeled here — Stripe deducts at payout).
 */
export function computeCharge(giftDollars: number, coverFees: boolean): ChargeBreakdown {
  const giftCents = Math.round(giftDollars * 100);
  if (!coverFees) {
    return { giftCents, feeCents: 0, chargedCents: giftCents };
  }
  const chargedCents = Math.ceil((giftCents + FEE_FIXED_CENTS) / (1 - FEE_PERCENT));
  return { giftCents, feeCents: chargedCents - giftCents, chargedCents };
}
