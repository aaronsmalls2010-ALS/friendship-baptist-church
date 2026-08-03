import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isLikelyBot } from "@/lib/security/bot-protection";
import { sanitizeInput, sanitizeEmail } from "@/lib/security/sanitize";
import { getSiteUrl } from "@/lib/site-url";
import {
  getStripe,
  isStripeConfigured,
  normalizeGivingType,
  computeCharge,
} from "@/lib/stripe/client";
import { CHURCH_INFO } from "@/lib/constants";

/**
 * POST /api/give/checkout
 *
 * Creates a Stripe-hosted Checkout session for a one-time gift and returns its
 * URL for the browser to redirect to. The donation is NOT recorded here — the
 * webhook (checkout.session.completed) is the source of truth. We stash the
 * donor + gift details in BOTH the session and payment_intent metadata so the
 * webhook can record the gift even if it fires before the redirect resolves.
 *
 * When Stripe is not yet configured, responds 503 with { configured: false } so
 * the client can fall back to recording a giving intent.
 */

const CheckoutSchema = z.object({
  amount: z.coerce.number().positive().min(1, "Minimum gift is $1").max(100000),
  givingType: z.string().min(1).max(50),
  coverFees: z.boolean().optional().default(false),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  honeypot: z.string().optional(),
});

const TYPE_LABELS: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  building_fund: "Building Fund",
  mission: "Mission",
  other: "Gift",
};

export async function POST(request: NextRequest) {
  try {
    // Silently succeed for obvious bots without creating a session.
    if (isLikelyBot(request)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Public endpoint: 3 attempts/min per IP (a shade above the IWC public
    // baseline to tolerate a fat-fingered retry, still bot-hostile).
    const rl = await formRateLimit.check(3, `give:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString() } }
      );
    }

    const parsed = CheckoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
        { status: 400 }
      );
    }
    const { amount, givingType, coverFees, name, email, honeypot } = parsed.data;

    // Honeypot: pretend success, create nothing.
    if (honeypot) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!isStripeConfigured()) {
      // Rail is dormant — tell the client to fall back to the intent form.
      return NextResponse.json({ configured: false }, { status: 503 });
    }
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ configured: false }, { status: 503 });
    }

    const typeSlug = normalizeGivingType(givingType);
    const donorName = sanitizeInput(name).slice(0, 100);
    const donorEmail = email ? sanitizeEmail(email) : "";
    const { giftCents, feeCents, chargedCents } = computeCharge(amount, coverFees);

    const label = TYPE_LABELS[typeSlug] ?? "Gift";
    const description = coverFees
      ? `${label} of $${(giftCents / 100).toFixed(2)} (plus $${(feeCents / 100).toFixed(2)} to cover processing)`
      : `${label} to ${CHURCH_INFO.name}`;

    // Metadata mirrored onto the PaymentIntent so the webhook can map back.
    const metadata: Record<string, string> = {
      donation_type: typeSlug,
      donor_name: donorName,
      donor_email: donorEmail,
      gift_cents: String(giftCents),
      fee_cents: String(feeCents),
      cover_fees: coverFees ? "true" : "false",
    };

    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      ...(donorEmail ? { customer_email: donorEmail } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: chargedCents,
            product_data: {
              name: `${label} — ${CHURCH_INFO.name}`,
              description,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        description,
        metadata,
      },
      success_url: `${siteUrl}/give/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/give?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[GIVE/CHECKOUT]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong starting your gift. Please try again." },
      { status: 500 }
    );
  }
}
