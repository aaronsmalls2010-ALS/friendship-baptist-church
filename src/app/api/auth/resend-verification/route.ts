import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "@/lib/email/welcome";
import { getSiteUrl } from "@/lib/site-url";

/**
 * POST /api/auth/resend-verification
 * Body: { identifier: string }  // email address
 *
 * Re-sends the email verification link to an account that hasn't verified yet.
 * Always returns a generic success so the endpoint can't be used to discover
 * which emails have accounts (no user enumeration). Mints a fresh one-time
 * token each call.
 */

// ── Simple in-memory rate limit (per email) ──
const resendAttempts = new Map<string, { count: number; resetTime: number }>();

function checkResendLimit(key: string): boolean {
  const now = Date.now();
  const entry = resendAttempts.get(key);

  if (Math.random() < 0.05) {
    for (const [k, v] of resendAttempts) {
      if (now > v.resetTime) resendAttempts.delete(k);
    }
  }

  if (!entry || now > entry.resetTime) {
    // 3 resends per email per 15 minutes
    resendAttempts.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= 3;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generic response used for every outcome to avoid leaking account existence.
const GENERIC_OK = NextResponse.json({
  message:
    "If an unverified account exists for that email, a new verification link is on its way.",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = (body?.identifier ?? body?.email ?? "")
      .toString()
      .trim()
      .toLowerCase();

    // Validate shape only; never reveal whether the account exists.
    if (!rawIdentifier || !EMAIL_RE.test(rawIdentifier)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!checkResendLimit(rawIdentifier)) {
      // Still generic, but signal a wait.
      return NextResponse.json(
        {
          message:
            "Too many requests. Please wait a few minutes before requesting another verification email.",
        },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const admin = createAdminClient();

    // Look up the profile by email.
    const { data: profile } = await admin
      .from("profiles")
      .select("id, first_name, is_email_verified")
      .ilike("email", rawIdentifier)
      .maybeSingle();

    // No account, or already verified → say nothing, do nothing observable.
    if (!profile || profile.is_email_verified) {
      return GENERIC_OK;
    }

    // Mint a fresh one-time token and store it on the auth user's metadata
    // (this is what /api/auth/verify-email matches against).
    const verificationToken = randomUUID();
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const existingMeta = authUser.user?.user_metadata ?? {};

    const { error: updateErr } = await admin.auth.admin.updateUserById(
      profile.id,
      {
        user_metadata: {
          ...existingMeta,
          email_verification_token: verificationToken,
        },
      }
    );
    if (updateErr) {
      console.error("[AUTH] resend-verification metadata update failed:", updateErr);
      // Don't leak details; the user can retry.
      return GENERIC_OK;
    }

    const siteUrl = getSiteUrl();
    const verificationUrl = `${siteUrl}/auth/verify-email?token=${verificationToken}`;
    const firstName = (profile.first_name as string) || "Friend";

    const emailResult = await sendEmail({
      to: rawIdentifier,
      subject: `Verify your email — Friendship Baptist Church`,
      html: getWelcomeEmailHtml(firstName, verificationUrl),
      text: getWelcomeEmailText(firstName, verificationUrl),
    }).catch((err) => {
      console.error("[EMAIL] Resend verification failed:", err);
      return { success: false as const, error: "Email delivery failed." };
    });

    console.log("[AUDIT] auth.resend_verification", {
      userId: profile.id,
      emailSent: emailResult.success,
      timestamp: new Date().toISOString(),
    });

    return GENERIC_OK;
  } catch (err) {
    console.error("[AUTH] Unexpected resend-verification error:", err);
    // Generic even on error.
    return GENERIC_OK;
  }
}
