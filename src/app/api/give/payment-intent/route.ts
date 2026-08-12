import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isLikelyBot } from "@/lib/security/bot-protection";
import { sanitizeInput, sanitizeEmail } from "@/lib/security/sanitize";
import {
  getStripe,
  isStripeConfigured,
  normalizeGivingType,
  computeCharge,
} from "@/lib/stripe/client";
import { CHURCH_INFO } from "@/lib/constants";

/**
 * POST /api/give/payment-intent
 *
 * Creates a Stripe PaymentIntent for a one-time gift and returns its
 * client_secret so the on-page Payment Element can confirm the card WITHOUT
 * leaving the site. Card data goes straight from the browser to Stripe (the
 * church server never sees it), keeping us PCI SAQ-A.
 *
 * The donation is NOT recorded here — the `payment_intent.succeeded` webhook is
 * the source of truth. Donor + gift details ride along in the PaymentIntent
 * metadata so the webhook can record even if the browser closes.
 *
 * When Stripe is not configured, responds 503 { configured: false } so the
 * client can fall back to recording a giving intent.
 */

const Schema = z.object({
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
    if (isLikelyBot(request)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rl = await formRateLimit.check(5, `give-pi:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString() } }
      );
    }

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
        { status: 400 }
      );
    }
    const { amount, givingType, coverFees, name, email, honeypot } = parsed.data;

    if (honeypot) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!isStripeConfigured()) {
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

    const metadata: Record<string, string> = {
      donation_type: typeSlug,
      donor_name: donorName,
      donor_email: donorEmail,
      gift_cents: String(giftCents),
      fee_cents: String(feeCents),
      cover_fees: coverFees ? "true" : "false",
    };

    // Map the donor into a real Stripe Customer so the name/email show in the
    // dashboard (not just metadata). Reuse an existing customer by email so a
    // repeat giver isn't duplicated.
    let customerId: string | undefined;
    try {
      if (donorEmail) {
        const found = await stripe.customers.list({ email: donorEmail, limit: 1 });
        if (found.data[0]) {
          customerId = found.data[0].id;
          if (donorName && found.data[0].name !== donorName) {
            await stripe.customers.update(customerId, { name: donorName });
          }
        } else {
          customerId = (await stripe.customers.create({ name: donorName, email: donorEmail })).id;
        }
      } else if (donorName) {
        customerId = (await stripe.customers.create({ name: donorName })).id;
      }
    } catch (custErr) {
      // Non-fatal: proceed without a customer rather than block the gift.
      console.error("[GIVE/PAYMENT-INTENT] customer", custErr instanceof Error ? custErr.message : custErr);
    }

    // No receipt_email — the church sends its own branded receipt from the webhook.
    const intent = await stripe.paymentIntents.create({
      amount: chargedCents,
      currency: "usd",
      description,
      metadata,
      ...(customerId ? { customer: customerId } : {}),
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      return NextResponse.json({ error: "Could not start your gift." }, { status: 502 });
    }
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("[GIVE/PAYMENT-INTENT]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong starting your gift. Please try again." },
      { status: 500 }
    );
  }
}
