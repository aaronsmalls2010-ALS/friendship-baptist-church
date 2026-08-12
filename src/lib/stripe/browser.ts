import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Browser-side Stripe.js loader for the on-page Payment Element. Uses the
 * PUBLISHABLE key (safe to expose). Returns null when unconfigured so the /give
 * form can fall back to recording a giving intent. loadStripe is memoized so the
 * script loads only once per page.
 */
let cached: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!cached) cached = loadStripe(key);
  return cached;
}
