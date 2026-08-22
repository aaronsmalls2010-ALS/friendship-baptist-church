import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiRateLimit } from "@/lib/security/rate-limit";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push/send";

// web-push runs on the Node runtime; keep this route out of the Edge bundle.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser push subscriptions for the signed-in member.
 *
 * GET    — the VAPID public key the browser needs, plus whether the rail is live
 * POST   — save (or refresh) this device's subscription
 * DELETE — remove this device's subscription
 *
 * A subscription is always bound to the caller's own profile; the endpoint is
 * unique, so a device that re-subscribes updates its row instead of duplicating.
 */

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    configured: isPushConfigured() && Boolean(publicKey),
    publicKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { success } = await apiRateLimit.check(30, `push-sub:${ctx.user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const parsed = subscriptionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription." },
        { status: 400 }
      );
    }

    const { endpoint, keys } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("push_subscriptions").upsert(
      {
        profile_id: ctx.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[PUSH] save subscription error:", error);
      return NextResponse.json(
        { error: "Could not turn on notifications." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUSH] subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
    }

    const admin = createAdminClient();
    // Scoped to the caller's own profile: an endpoint string is not authority.
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("profile_id", ctx.user.id);

    if (error) {
      console.error("[PUSH] delete subscription error:", error);
      return NextResponse.json(
        { error: "Could not turn off notifications." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUSH] unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
