import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export const runtime = "nodejs";

/**
 * POST /api/admin/donations/[id]/refund
 *
 * Refund a Stripe gift (full or partial) from the admin. Finance-capable roles
 * only; a reason is required and every refund is audit-logged. Amounts are
 * expressed in the recorded gift's dollars; a full refund returns the entire
 * remaining Stripe charge (including any covered fee) to the donor.
 *
 * Body: { amount?: number; reason: string }  — omit amount for a full refund.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  let body: { amount?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "A reason is required to refund." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: donation } = await admin
    .from("donations")
    .select("id, amount, method, stripe_payment_id, refunded_amount, refund_status, archived_at")
    .eq("id", id)
    .maybeSingle();

  if (!donation) {
    return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  }
  if (donation.archived_at) {
    return NextResponse.json({ error: "This donation is voided." }, { status: 400 });
  }
  if (donation.method !== "stripe" || !donation.stripe_payment_id) {
    return NextResponse.json(
      { error: "Only online (Stripe) gifts can be refunded here. Reverse cash/check gifts by voiding them." },
      { status: 400 }
    );
  }
  if (donation.refund_status === "full") {
    return NextResponse.json({ error: "This gift is already fully refunded." }, { status: 400 });
  }

  const gift = Number(donation.amount);
  const already = Number(donation.refunded_amount) || 0;
  const remaining = Math.round((gift - already) * 100) / 100;
  if (remaining <= 0) {
    return NextResponse.json({ error: "Nothing left to refund on this gift." }, { status: 400 });
  }

  const requested =
    body.amount === undefined || body.amount === null || body.amount === ""
      ? remaining
      : Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(requested) || requested <= 0) {
    return NextResponse.json({ error: "Enter a valid refund amount." }, { status: 400 });
  }
  if (requested > remaining + 0.005) {
    return NextResponse.json(
      { error: `Refund can't exceed the $${remaining.toFixed(2)} remaining on this gift.` },
      { status: 400 }
    );
  }
  const isFull = requested >= remaining - 0.005;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let refundId: string;
  try {
    const refund = await stripe.refunds.create({
      payment_intent: donation.stripe_payment_id,
      // Full refund: omit amount so Stripe returns the entire remaining charge
      // (gift + any covered fee). Partial: refund the requested dollars.
      ...(isFull ? {} : { amount: Math.round(requested * 100) }),
      reason: "requested_by_customer",
      metadata: { donation_id: id, church_reason: reason.slice(0, 200), refunded_by: auth.user.id },
    });
    refundId = refund.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe refund failed.";
    console.error("[ADMIN/REFUND]", message);
    return NextResponse.json({ error: `Refund failed: ${message}` }, { status: 502 });
  }

  const newRefunded = Math.min(gift, Math.round((already + requested) * 100) / 100);
  const status = newRefunded >= gift - 0.005 ? "full" : "partial";

  const { error: updErr } = await admin
    .from("donations")
    .update({
      refunded_amount: newRefunded,
      refunded_at: new Date().toISOString(),
      refunded_by: auth.user.id,
      stripe_refund_id: refundId,
      refund_status: status,
    })
    .eq("id", id);
  if (updErr) {
    // The money was refunded in Stripe; surface the ledger error but the
    // charge.refunded webhook will reconcile the record.
    console.error("[ADMIN/REFUND] ledger update failed:", updErr.message);
    return NextResponse.json(
      { error: "Refund issued in Stripe, but updating the record failed. It will reconcile shortly." },
      { status: 500 }
    );
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "donation.refund",
    userId: auth.user.id,
    resourceType: "donation",
    resourceId: id,
    metadata: { amount: requested, full: isFull, reason, stripe_refund_id: refundId },
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    refund_status: status,
    refunded_amount: newRefunded,
    refund_id: refundId,
  });
}
