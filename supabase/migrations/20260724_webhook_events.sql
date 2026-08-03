-- Donations online-giving groundwork §1 — webhook idempotency ledger
--
-- Stripe delivers each webhook event AT LEAST once and retries on any non-2xx
-- response. To make donation recording exactly-once, the webhook handler claims
-- an event by inserting its id here BEFORE doing any work; a unique-violation
-- means we've already processed it and can safely ack as a duplicate. If
-- processing then fails, the handler DELETES its claim so Stripe's retry re-runs.
--
-- Generic (provider, event_id) shape so the same table serves any future
-- processor (PayPal, etc.), matching the reusable IWC Stripe playbook.

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL DEFAULT 'stripe',
  event_id    TEXT NOT NULL,
  event_type  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_provider_event_id_key UNIQUE (provider, event_id)
);

-- Server-only table: written exclusively by the webhook route using the service
-- role (which bypasses RLS). Enable RLS with NO policies so the anon/auth keys
-- can never read or write it, matching the security posture of other internal
-- tables in this schema.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
