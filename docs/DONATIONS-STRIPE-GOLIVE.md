# Online Giving — Stripe Go-Live Playbook

The online-giving rail is **fully built and dormant.** With no Stripe keys set,
`/give` records a *giving intent* (emails the office) exactly as before. Set the
keys and redeploy, and the same page takes real card donations. This is the
"small future effort" — no further code required for one-time giving.

## What's already in place (this repo)

| Piece | Location |
|---|---|
| Idempotency ledger | `supabase/migrations/20260724_webhook_events.sql` |
| Stripe client + fee math | `src/lib/stripe/client.ts` |
| Checkout session route | `src/app/api/give/checkout/route.ts` |
| Webhook (source of truth) | `src/app/api/webhooks/stripe/route.ts` |
| Give form (adapts to config) | `src/app/(public)/give/give-form.tsx` |
| Thank-you page | `src/app/(public)/give/thank-you/page.tsx` |
| Donation storage, admin ledger, portal history, annual statement | (pre-existing) |

**Architecture:** Stripe-hosted Checkout → card entry stays in Stripe's iframe →
we remain PCI SAQ-A, no publishable key server-side. The **webhook is the source
of truth**: the donation row is written when `checkout.session.completed` fires,
not from the browser, so a donor who closes the tab is still recorded.

## Prerequisites (Aaron / the church — I can't do these)

1. **Stripe account** for The Friendship Baptist Church, tied to the church's
   501(c)(3) EIN and **bank account** (only needed to activate *live* payouts —
   test mode works immediately).
2. Apply for **Stripe nonprofit pricing** (2.2% + $0.30) once the account exists.

## Step 1 — Run the migration

Supabase SQL editor → run `20260724_webhook_events.sql`. Verify the table exists:

```sql
select * from public.webhook_events limit 1;   -- table exists, 0 rows
```

## Step 2 — Test mode end-to-end (no real money)

1. Stripe Dashboard (test mode) → **Developers → API keys** → copy the
   `sk_test_...` secret key.
2. Create a **webhook endpoint** → URL `https://thefriendshipbaptist.com/api/webhooks/stripe`,
   event: **`checkout.session.completed`** only → copy the `whsec_...` **signing secret**.
3. In **Vercel → Project → Settings → Environment Variables** (Production), set:
   - `STRIPE_SECRET_KEY = sk_test_...`
   - `STRIPE_WEBHOOK_SECRET = whsec_...`
   (Set in the **dashboard**, not the CLI — the CLI corrupts values on Windows.)
4. **Redeploy** (env changes don't apply to existing deployments).
5. On `/give`, the button now reads **"Continue to Secure Checkout."** Give a test
   gift with card `4242 4242 4242 4242`, any future expiry/CVC.
6. Verify: donor + office receipt emails arrive, and the gift appears in
   **Admin → Donations** with method `stripe` and a `pi_...` reference.

## Step 3 — Go live

1. Toggle Stripe to **live mode**, grab the `sk_live_...` key.
2. Create a **new live webhook** (its own `whsec_...`) — same URL, same single event.
3. Update the two Vercel env vars to the **live** values and **redeploy**.
   - ⚠️ Never mix a live key with a test webhook secret → signature failures.
4. Confirm you're live without a real charge: start a checkout and check the
   redirect URL contains `cs_live_` (not `cs_test_`).

## Notes & fast-follows

- **Fee coverage:** donors can opt to "cover card processing fees" so 100% of the
  gift reaches the church. Math is grossed-up server-side; the recorded donation
  amount is always the *intended gift*, with the covered fee stored in metadata.
- **Recurring giving** is intentionally out of scope for v1 (one-time first). The
  FAQ points donors to the office for recurring. Phase 2 = Stripe Billing
  subscriptions + a subscriptions webhook set + member self-management.
- **Refunds:** issue from the Stripe dashboard for now. A `charge.refunded`
  handler + a refund column can be added later to auto-reconcile the ledger.
- **Guest gifts** are matched to a member profile by email when one exists (so it
  shows in their portal history + annual statement); otherwise recorded as a
  guest gift with `profile_id = null`.
- **Verify emails via Vercel runtime logs**, not the inbox. `RESEND_API_KEY` must
  be set (already used for auth emails). From-address is on the verified
  `thefriendshipbaptist.com` domain.
