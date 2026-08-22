import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getPushAudienceStats,
  isPushConfigured,
  sendPushToProfiles,
} from "@/lib/push/send";
import { notifyCongregation } from "@/lib/push/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A congregation-wide fan-out can take a while; give it room.
export const maxDuration = 60;

/**
 * Admin Push Center.
 *
 * GET  — audience size + whether the rail is configured
 * POST — broadcast a notification to every member who enabled push
 *
 * `test: true` sends only to the admin's own devices so a message can be
 * previewed on a real phone before it goes to the whole church.
 */

const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(300),
  url: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[^\s]*$/, "Link must be a path on this site, e.g. /events")
    .optional()
    .or(z.literal("")),
  test: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const stats = await getPushAudienceStats();
  return NextResponse.json({ configured: isPushConfigured(), ...stats });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = broadcastSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message." },
        { status: 400 }
      );
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        {
          error:
            "Push notifications are not configured. Add the VAPID keys in Vercel and redeploy.",
        },
        { status: 503 }
      );
    }

    const { title, body, test } = parsed.data;
    const url = parsed.data.url || "/portal/notifications";

    if (test) {
      const result = await sendPushToProfiles([auth.user.id], {
        title,
        body,
        url,
        tag: "admin-test",
      });
      return NextResponse.json({ test: true, ...result });
    }

    const result = await notifyCongregation({
      topic: "broadcast",
      title,
      body,
      url,
    });

    console.log("[AUDIT] push.broadcast", {
      sentBy: auth.user.id,
      title,
      devices: result.sent,
      inApp: result.inApp,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ test: false, ...result });
  } catch (err) {
    console.error("[PUSH] broadcast error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
