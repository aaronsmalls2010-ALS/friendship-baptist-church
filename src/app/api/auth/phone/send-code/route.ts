import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issuePhoneOtp } from "@/lib/auth/phone-otp";

/**
 * POST /api/auth/phone/send-code
 *
 * (Re)send a phone-verification SMS code for an already-created, not-yet-
 * verified account. Body: { userId }.
 *
 * Per-phone cooldown / hourly caps are enforced inside issuePhoneOtp; this
 * route adds a coarse per-IP cap on top (middleware already rate-limits /api).
 */
const ipSends = new Map<string, { count: number; resetTime: number }>();

function checkIpLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipSends.get(ip);
  if (Math.random() < 0.05) {
    for (const [k, v] of ipSends) if (now > v.resetTime) ipSends.delete(k);
  }
  if (!entry || now > entry.resetTime) {
    ipSends.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= 10;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkIpLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing account reference." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Look up the account; only resend for unverified accounts that have a phone.
    const { data: profile } = await admin
      .from("profiles")
      .select("phone, is_phone_verified")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || !profile.phone) {
      // Generic response — don't reveal whether the account exists.
      return NextResponse.json(
        { error: "Unable to send a code for this account." },
        { status: 400 }
      );
    }

    if (profile.is_phone_verified) {
      return NextResponse.json(
        { message: "This phone number is already verified.", alreadyVerified: true },
        { status: 200 }
      );
    }

    const issued = await issuePhoneOtp(admin, userId, profile.phone, "signup");
    if (!issued.ok) {
      return NextResponse.json(
        { error: issued.error },
        {
          status: issued.status,
          headers: issued.retryAfter
            ? { "Retry-After": issued.retryAfter.toString() }
            : undefined,
        }
      );
    }

    return NextResponse.json({ message: "Verification code sent." }, { status: 200 });
  } catch (err) {
    console.error("[AUTH] phone/send-code error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
