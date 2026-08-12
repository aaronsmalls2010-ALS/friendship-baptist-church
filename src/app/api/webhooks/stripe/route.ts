import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, normalizeGivingType } from "@/lib/stripe/client";
import { sendEmail } from "@/lib/email/send";
import { CHURCH_INFO } from "@/lib/constants";
import type Stripe from "stripe";

// Stripe signature verification needs the RAW request body, so this route must
// run on the Node runtime and never be statically optimized.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe  — the SOURCE OF TRUTH for online donations.
 *
 * Flow (per the IWC Stripe playbook):
 *   1. Verify the signature against the RAW body + STRIPE_WEBHOOK_SECRET.
 *   2. Claim the event by inserting its id into webhook_events (unique). A
 *      duplicate claim ⇒ we already processed it ⇒ ack 200.
 *   3. Handle checkout.session.completed: record the donation, email receipts.
 *   4. On any processing error, DELETE the claim so Stripe's retry re-runs.
 *
 * Subscribe ONLY to checkout.session.completed in the Stripe dashboard/API.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? "")
    .replace(new RegExp("^" + String.fromCharCode(0xfeff)), "")
    .trim();

  if (!stripe || !webhookSecret) {
    // Rail dormant / misconfigured. 400 (not 200) so a real misconfig is loud
    // in Stripe's dashboard rather than silently swallowed.
    return NextResponse.json({ error: "Stripe not configured." }, { status: 400 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Idempotency claim ──
  const { error: claimError } = await admin
    .from("webhook_events")
    .insert({ provider: "stripe", event_id: event.id, event_type: event.type });

  if (claimError) {
    // Unique violation (23505) ⇒ already handled ⇒ ack as duplicate.
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[STRIPE WEBHOOK] claim insert failed:", claimError.message);
    return NextResponse.json({ error: "Ledger unavailable." }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await recordDonation(admin, event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "payment_intent.succeeded") {
      await recordDonationFromIntent(admin, event.data.object as Stripe.PaymentIntent);
    }
    // Other event types: acknowledged but intentionally unhandled in v1.
    return NextResponse.json({ received: true });
  } catch (err) {
    // Release the claim so Stripe's automatic retry re-processes this event.
    await admin.from("webhook_events").delete().eq("provider", "stripe").eq("event_id", event.id);
    console.error("[STRIPE WEBHOOK] processing error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Processing failed; will retry." }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordDonation(admin: any, session: Stripe.Checkout.Session) {
  // Only record fully-paid sessions.
  if (session.payment_status !== "paid") return;

  const meta = session.metadata ?? {};
  const typeSlug = normalizeGivingType(meta.donation_type);
  const giftCents = Number(meta.gift_cents) || session.amount_total || 0;
  const feeCents = Number(meta.fee_cents) || 0;
  const amount = Math.round(giftCents) / 100;
  if (amount <= 0) return;

  const donorName = (meta.donor_name ?? "").trim();
  const donorEmail = (meta.donor_email ?? session.customer_details?.email ?? "").trim().toLowerCase();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Look up the managed donation_types row for the FK (best-effort).
  let donationTypeId: string | null = null;
  const { data: typeRow } = await admin
    .from("donation_types")
    .select("id")
    .eq("slug", typeSlug)
    .maybeSingle();
  if (typeRow) donationTypeId = typeRow.id;

  // Match a member profile by email so the gift shows in their giving history
  // and annual statement. No match (guest gift) ⇒ profile_id stays null.
  let profileId: string | null = null;
  if (donorEmail) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", donorEmail)
      .maybeSingle();
    if (profile) profileId = profile.id;
  }

  const { error: insertError } = await admin.from("donations").insert({
    profile_id: profileId,
    amount, // the intended gift — what the church records and nets
    donation_type: typeSlug, // enum column
    donation_type_id: donationTypeId, // managed FK
    is_recurring: false,
    method: "stripe",
    stripe_payment_id: paymentIntentId,
    metadata: {
      checkout_session: session.id,
      charged_cents: session.amount_total,
      fee_covered_cents: feeCents,
      cover_fees: meta.cover_fees === "true",
      donor_name: donorName,
      donor_email: donorEmail,
    },
  });
  if (insertError) throw new Error(`donation insert failed: ${insertError.message}`);

  // Receipts are best-effort — a delivery failure must NOT trigger a webhook
  // retry (the money already moved and the donation is recorded).
  const reference = paymentIntentId ?? session.id;
  await sendReceipts({ donorName, donorEmail, amount, typeSlug, reference }).catch((e) =>
    console.error("[STRIPE WEBHOOK] receipt email failed:", e instanceof Error ? e.message : e)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordDonationFromIntent(admin: any, intent: Stripe.PaymentIntent) {
  // Only record fully-paid intents.
  if (intent.status !== "succeeded") return;

  const meta = intent.metadata ?? {};
  const typeSlug = normalizeGivingType(meta.donation_type);
  const giftCents = Number(meta.gift_cents) || intent.amount_received || intent.amount || 0;
  const feeCents = Number(meta.fee_cents) || 0;
  const amount = Math.round(giftCents) / 100;
  if (amount <= 0) return;

  const donorName = (meta.donor_name ?? "").trim();
  const donorEmail = (meta.donor_email ?? intent.receipt_email ?? "").trim().toLowerCase();

  // Idempotency backstop: never record the same PaymentIntent twice, even if a
  // duplicate/related event slips through the webhook_events claim.
  const { data: existing } = await admin
    .from("donations")
    .select("id")
    .eq("stripe_payment_id", intent.id)
    .maybeSingle();
  if (existing) return;

  let donationTypeId: string | null = null;
  const { data: typeRow } = await admin
    .from("donation_types")
    .select("id")
    .eq("slug", typeSlug)
    .maybeSingle();
  if (typeRow) donationTypeId = typeRow.id;

  let profileId: string | null = null;
  if (donorEmail) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", donorEmail)
      .maybeSingle();
    if (profile) profileId = profile.id;
  }

  const { error: insertError } = await admin.from("donations").insert({
    profile_id: profileId,
    amount,
    donation_type: typeSlug,
    donation_type_id: donationTypeId,
    is_recurring: false,
    method: "stripe",
    stripe_payment_id: intent.id,
    metadata: {
      payment_intent: intent.id,
      charged_cents: intent.amount,
      fee_covered_cents: feeCents,
      cover_fees: meta.cover_fees === "true",
      donor_name: donorName,
      donor_email: donorEmail,
    },
  });
  if (insertError) throw new Error(`donation insert failed: ${insertError.message}`);

  const reference = intent.id;
  await sendReceipts({ donorName, donorEmail, amount, typeSlug, reference }).catch((e) =>
    console.error("[STRIPE WEBHOOK] receipt email failed:", e instanceof Error ? e.message : e)
  );
}

const TYPE_LABELS: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  building_fund: "Building Fund",
  mission: "Mission",
  other: "Gift",
};

async function sendReceipts(args: {
  donorName: string;
  donorEmail: string;
  amount: number;
  typeSlug: string;
  reference: string;
}) {
  const { donorName, donorEmail, amount, typeSlug, reference } = args;
  const label = TYPE_LABELS[typeSlug] ?? "Gift";
  const amountStr = `$${amount.toFixed(2)}`;
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Branded donor confirmation ──
  if (donorEmail) {
    const html = donorReceiptHtml({ donorName, amountStr, label, dateStr, reference });
    const text = [
      `Thank you for your generous ${label.toLowerCase()} of ${amountStr} to ${CHURCH_INFO.name}.`,
      ``,
      `Date: ${dateStr}`,
      `Reference: ${reference}`,
      ``,
      `${CHURCH_INFO.name} is a registered 501(c)(3) nonprofit. This email serves as your`,
      `receipt; no goods or services were provided in exchange for this gift. Please retain it`,
      `for your tax records. An annual giving statement is available in your member portal.`,
      ``,
      `${CHURCH_INFO.name} · ${CHURCH_INFO.address.street}, ${CHURCH_INFO.address.city}, ${CHURCH_INFO.address.state} ${CHURCH_INFO.address.zip}`,
      CHURCH_INFO.phone,
    ].join("\n");

    await sendEmail({
      to: donorEmail,
      subject: `Your gift to ${CHURCH_INFO.name} — thank you`,
      html,
      text,
    });
  }

  // ── Office notification ──
  await sendEmail({
    to: CHURCH_INFO.email,
    subject: `New online gift: ${amountStr} (${label})`,
    html: `<p>A new online gift was received.</p>
<ul>
  <li><strong>Amount:</strong> ${amountStr}</li>
  <li><strong>Type:</strong> ${label}</li>
  <li><strong>Donor:</strong> ${escapeHtml(donorName) || "—"}${donorEmail ? ` (${escapeHtml(donorEmail)})` : ""}</li>
  <li><strong>Date:</strong> ${dateStr}</li>
  <li><strong>Reference:</strong> ${escapeHtml(reference)}</li>
</ul>
<p>This gift has been recorded in the donations ledger.</p>`,
    text: `New online gift: ${amountStr} (${label}) from ${donorName || "—"}${donorEmail ? ` (${donorEmail})` : ""} on ${dateStr}. Ref: ${reference}.`,
  });
}

function donorReceiptHtml(args: {
  donorName: string;
  amountStr: string;
  label: string;
  dateStr: string;
  reference: string;
}): string {
  const { donorName, amountStr, label, dateStr, reference } = args;
  const greeting = donorName ? `Dear ${escapeHtml(donorName)},` : "Dear Friend,";
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;color:#2b2b2b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#4c1d95;padding:28px 32px;text-align:center;">
          <div style="color:#f5d97a;font-size:22px;font-weight:bold;letter-spacing:0.3px;">${escapeHtml(CHURCH_INFO.name)}</div>
          <div style="color:#e7dcff;font-size:13px;margin-top:4px;">${escapeHtml(CHURCH_INFO.tagline)}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;">${greeting}</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
            Thank you for your generous ${escapeHtml(label.toLowerCase())}. Your gift supports the ministries,
            outreach, and church family of ${escapeHtml(CHURCH_INFO.name)}. We are grateful for your faithfulness.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #eee3d6;border-radius:10px;margin:0 0 20px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:13px;color:#8a7f70;text-transform:uppercase;letter-spacing:0.5px;">Gift Amount</div>
              <div style="font-size:30px;font-weight:bold;color:#4c1d95;margin:4px 0 12px;">${amountStr}</div>
              <div style="font-size:14px;color:#4a4a4a;"><strong>Type:</strong> ${escapeHtml(label)}</div>
              <div style="font-size:14px;color:#4a4a4a;"><strong>Date:</strong> ${escapeHtml(dateStr)}</div>
              <div style="font-size:14px;color:#4a4a4a;"><strong>Reference:</strong> ${escapeHtml(reference)}</div>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#8a7f70;line-height:1.6;">
            ${escapeHtml(CHURCH_INFO.name)} is a registered 501(c)(3) nonprofit organization. No goods or services
            were provided in exchange for this contribution. Please retain this receipt for your tax records; an
            annual giving statement is also available in your member portal.
          </p>
        </td></tr>
        <tr><td style="background:#faf7f2;padding:20px 32px;text-align:center;font-size:12px;color:#8a7f70;border-top:1px solid #eee3d6;">
          ${escapeHtml(CHURCH_INFO.name)}<br/>
          ${escapeHtml(CHURCH_INFO.address.street)}, ${escapeHtml(CHURCH_INFO.address.city)}, ${escapeHtml(CHURCH_INFO.address.state)} ${escapeHtml(CHURCH_INFO.address.zip)}<br/>
          ${escapeHtml(CHURCH_INFO.phone)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
