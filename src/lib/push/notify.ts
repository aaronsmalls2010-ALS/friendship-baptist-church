import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToTopic, type PushTopic, type PushResult } from "@/lib/push/send";

/**
 * Congregation-wide notification fan-out.
 *
 * Writes an in-app notification row for every member the topic applies to AND
 * pushes to their devices, so a member who misses the push still finds it in
 * /portal/notifications. Push is the delivery channel; the notifications table
 * is the record.
 *
 * Both halves are best-effort: a failure in one is logged and does not abort
 * the other, and neither ever throws into the caller's request.
 */

/** notification_type enum values that exist in the database. */
type NotificationType = "event" | "announcement" | "ministry" | "prayer" | "system";

function notificationTypeFor(topic: PushTopic): NotificationType {
  switch (topic) {
    case "event":
    case "digest":
      return "event";
    case "announcement":
      return "announcement";
    case "broadcast":
      return "system";
  }
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

/** Write one in-app notification per opted-in member. Returns rows written. */
async function writeInAppNotifications(
  topic: PushTopic,
  title: string,
  body: string,
  url?: string
): Promise<number> {
  const admin = createAdminClient();
  const prefColumn = prefColumnFor(topic);

  // Archived and deceased members stay on the roster but stop receiving church
  // messages. Archiving is `archived_at`, not a status value.
  let query = admin
    .from("profiles")
    .select("id")
    .is("archived_at", null)
    .neq("status", "deceased");
  if (prefColumn) query = query.neq(prefColumn, false);

  const { data: profiles, error } = await query;
  if (error) {
    console.error("[NOTIFY] load recipients error:", error);
    return 0;
  }

  const rows = (profiles ?? []).map((p) => ({
    profile_id: (p as { id: string }).id,
    type: notificationTypeFor(topic),
    title,
    body: body.slice(0, 500),
    action_url: url ?? null,
  }));

  if (rows.length === 0) return 0;

  // Chunked so a large congregation does not hit the PostgREST payload cap.
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error: insertError } = await admin
      .from("notifications")
      .insert(rows.slice(i, i + CHUNK));
    if (insertError) {
      console.error("[NOTIFY] insert notifications error:", insertError);
    } else {
      written += Math.min(CHUNK, rows.length - i);
    }
  }
  return written;
}

export type NotifyResult = PushResult & { inApp: number };

/**
 * Notify the congregation about something — in-app record + push delivery.
 * Safe to call inline from an admin route; never throws.
 */
export async function notifyCongregation(opts: {
  topic: PushTopic;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  /** Skip the in-app notification row (e.g. for a test send). */
  skipInApp?: boolean;
}): Promise<NotifyResult> {
  const { topic, title, body, url, tag, skipInApp } = opts;

  let inApp = 0;
  if (!skipInApp) {
    try {
      inApp = await writeInAppNotifications(topic, title, body, url);
    } catch (err) {
      console.error("[NOTIFY] in-app write threw:", err);
    }
  }

  let push: PushResult = { sent: 0, failed: 0, pruned: 0 };
  try {
    push = await sendPushToTopic(topic, { title, body, url, tag });
  } catch (err) {
    console.error("[NOTIFY] push threw:", err);
    push = { sent: 0, failed: 0, pruned: 0, note: "Push delivery failed." };
  }

  return { ...push, inApp };
}
