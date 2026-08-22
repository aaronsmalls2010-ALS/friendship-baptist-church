import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { apiRateLimit } from "@/lib/security/rate-limit";
import { sendPushToProfiles, isPushConfigured } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portal/push/test
 *
 * Sends a test notification to the caller's own devices only — the "did that
 * actually work?" button after enabling notifications. Never touches anyone
 * else's subscriptions and writes no in-app notification.
 */
export async function POST() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { success } = await apiRateLimit.check(5, `push-test:${ctx.user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: "Please wait a moment before sending another test." },
        { status: 429 }
      );
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: "Push notifications are not configured yet." },
        { status: 503 }
      );
    }

    const result = await sendPushToProfiles([ctx.user.id], {
      title: "Friendship Baptist",
      body: "Notifications are on. This is what a church update will look like.",
      url: "/portal/notifications",
      tag: "push-test",
    });

    return NextResponse.json({ success: result.sent > 0, ...result });
  } catch (err) {
    console.error("[PUSH] test send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
