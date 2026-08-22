import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Web Push (PWA) delivery.
 *
 * Server-side only. Reads VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY from the
 * environment; with either missing the whole rail is dormant and every send is
 * a no-op that reports NOT_CONFIGURED (mirrors the SMS + Stripe rails).
 *
 * Subscriptions live in `push_subscriptions` (owner-only RLS). The fan-out runs
 * through the service-role client because it must read every member's endpoint.
 * Endpoints the push service rejects with 404/410 are permanently dead and get
 * deleted so the table does not accumulate garbage.
 */

/** Which member preference gates a given push. */
export type PushTopic =
  | "event" // gated by profiles.notify_events
  | "announcement" // gated by profiles.notify_newsletter
  | "digest" // gated by profiles.notify_events
  | "broadcast"; // ungated — goes to everyone who enabled notifications

export type PushPayload = {
  title: string;
  body: string;
  /** In-app path the notification opens, e.g. "/events". */
  url?: string;
  /**
   * Collapse key. Two notifications sharing a tag replace each other instead of
   * stacking — used so a re-sent event reminder does not pile up.
   */
  tag?: string;
};

export type PushResult = {
  sent: number;
  failed: number;
  pruned: number;
  /** Present only when the rail is dormant or the audience was empty. */
  note?: string;
};

type SubscriptionRow = {
  id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const CONTACT =
  process.env.VAPID_CONTACT_EMAIL || "mailto:info@thefriendshipbaptist.com";

/** True when VAPID keys are present in the environment. */
export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * The public VAPID key the browser needs to create a subscription. Prefers the
 * server-only var so the two can never drift; falls back to the NEXT_PUBLIC_
 * copy if only that one is set.
 */
export function getVapidPublicKey(): string | null {
  return (
    process.env.VAPID_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    null
  );
}

/** The profile preference column that gates a topic, or null if ungated. */
function prefColumnFor(topic: PushTopic): "notify_events" | "notify_newsletter" | null {
  switch (topic) {
    case "event":
    case "digest":
      return "notify_events";
    case "announcement":
      return "notify_newsletter";
    case "broadcast":
      return null;
  }
}

/**
 * Deliver a push to every device belonging to `profileIds`. Pass null to reach
 * every subscribed device (already-filtered audiences call it with ids).
 */
async function deliver(
  subscriptions: SubscriptionRow[],
  payload: PushPayload
): Promise<PushResult> {
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, pruned: 0, note: "No subscribed devices." };
  }

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(
    CONTACT,
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/portal",
    tag: payload.tag,
  });

  let sent = 0;
  let failed = 0;
  const deadEndpoints: string[] = [];
  const liveIds: string[] = [];

  // Send in batches so a large congregation does not open hundreds of sockets
  // at once (and so one slow push service cannot stall the whole run).
  const BATCH = 25;
  for (let i = 0; i < subscriptions.length; i += BATCH) {
    const batch = subscriptions.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
            { TTL: 60 * 60 * 24 } // hold for a day if the device is offline
          );
          sent++;
          liveIds.push(sub.id);
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            // Subscription is permanently gone (app deleted, permission
            // revoked, browser reset). Remove it rather than retrying forever.
            deadEndpoints.push(sub.endpoint);
          } else {
            failed++;
            console.error("[PUSH] send failed:", status ?? err);
          }
        }
      })
    );
  }

  const admin = createAdminClient();

  if (deadEndpoints.length > 0) {
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", deadEndpoints);
    if (error) console.error("[PUSH] prune failed:", error);
  }

  if (liveIds.length > 0) {
    const { error } = await admin
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .in("id", liveIds);
    if (error) console.error("[PUSH] last_used_at update failed:", error);
  }

  return { sent, failed, pruned: deadEndpoints.length };
}

/** Send to specific members (all of their devices). Ignores topic preferences. */
export async function sendPushToProfiles(
  profileIds: string[],
  payload: PushPayload
): Promise<PushResult> {
  if (!isPushConfigured()) {
    return {
      sent: 0,
      failed: 0,
      pruned: 0,
      note: "Push notifications are not configured.",
    };
  }
  if (profileIds.length === 0) {
    return { sent: 0, failed: 0, pruned: 0, note: "No recipients." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, profile_id, endpoint, p256dh, auth")
    .in("profile_id", profileIds);

  if (error) {
    console.error("[PUSH] load subscriptions error:", error);
    return { sent: 0, failed: 0, pruned: 0, note: "Could not load subscribers." };
  }

  return deliver((data ?? []) as SubscriptionRow[], payload);
}

/**
 * Send to the whole congregation, honoring the member preference that gates the
 * topic. A member with push enabled but the matching preference switched off is
 * skipped.
 */
export async function sendPushToTopic(
  topic: PushTopic,
  payload: PushPayload
): Promise<PushResult> {
  if (!isPushConfigured()) {
    return {
      sent: 0,
      failed: 0,
      pruned: 0,
      note: "Push notifications are not configured.",
    };
  }

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, profile_id, endpoint, p256dh, auth");

  if (error) {
    console.error("[PUSH] load subscriptions error:", error);
    return { sent: 0, failed: 0, pruned: 0, note: "Could not load subscribers." };
  }

  let rows = (subs ?? []) as SubscriptionRow[];
  const prefColumn = prefColumnFor(topic);

  if (rows.length > 0) {
    // Resolve preferences in a second query rather than a PostgREST embed —
    // embeds break the moment a second FK to profiles is added.
    const profileIds = [...new Set(rows.map((r) => r.profile_id))];
    const { data: profiles, error: profileError } = await admin
      .from("profiles")
      .select(
        prefColumn
          ? `id, status, archived_at, ${prefColumn}`
          : "id, status, archived_at"
      )
      .in("id", profileIds);

    if (profileError) {
      console.error("[PUSH] load preferences error:", profileError);
      return {
        sent: 0,
        failed: 0,
        pruned: 0,
        note: "Could not load member preferences.",
      };
    }

    // Archived and deceased members stay on the roster but stop receiving
    // church messages. Archiving is `archived_at`, not a status value.
    const eligible = new Set(
      (profiles ?? [])
        .filter((p) => {
          const row = p as unknown as Record<string, unknown>;
          if (row.archived_at) return false;
          if (row.status === "deceased") return false;
          if (prefColumn && row[prefColumn] === false) return false;
          return true;
        })
        .map((p) => (p as unknown as { id: string }).id)
    );
    rows = rows.filter((r) => eligible.has(r.profile_id));
  }

  return deliver(rows, payload);
}

/** How many members / devices currently have notifications enabled. */
export async function getPushAudienceStats(): Promise<{
  devices: number;
  members: number;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("profile_id");

  if (error) {
    console.error("[PUSH] stats error:", error);
    return { devices: 0, members: 0 };
  }

  const rows = data ?? [];
  return {
    devices: rows.length,
    members: new Set(rows.map((r) => r.profile_id)).size,
  };
}
