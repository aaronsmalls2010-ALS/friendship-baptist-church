import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from "@/lib/email/password-reset";

/**
 * POST /api/auth/reset-password/request
 * Body: { email: string }
 *
 * Issues a one-time, 1-hour password-reset link and emails it via Resend.
 * Always returns a generic success so the endpoint can't reveal which emails
 * have accounts (no enumeration). The token is stored HASHED (sha256 + pepper)
 * in the auth user's metadata; the raw token only ever lives in the email.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Per-email rate limit (in-memory) ──
const attempts = new Map<string, { count: number; resetTime: number }>();
function withinLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (Math.random() < 0.05) {
    for (const [k, v] of attempts) if (now > v.resetTime) attempts.delete(k);
  }
  if (!entry || now > entry.resetTime) {
    attempts.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= 3; // 3 reset requests per email / 15 min
}

function hashToken(raw: string): string {
  const pepper = (process.env.OTP_PEPPER ?? "").trim();
  return createHash("sha256").update(`${raw}:${pepper}`).digest("hex");
}

const GENERIC_OK = NextResponse.json({
  message:
    "If an account exists for that email, a password reset link is on its way.",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body?.email ?? "").toString().trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!withinLimit(email)) {
      return NextResponse.json(
        {
          message:
            "Too many reset requests. Please wait a few minutes and try again.",
        },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("id, first_name")
      .ilike("email", email)
      .maybeSingle();

    // No account → say nothing, do nothing observable.
    if (!profile) return GENERIC_OK;

    // Mint a high-entropy token; store only its hash + expiry on the user.
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const existingMeta = authUser.user?.user_metadata ?? {};

    const { error: updateErr } = await admin.auth.admin.updateUserById(
      profile.id,
      {
        user_metadata: {
          ...existingMeta,
          password_reset_token_hash: tokenHash,
          password_reset_expires: expiresAt,
        },
      }
    );
    if (updateErr) {
      console.error("[AUTH] reset-password request update failed:", updateErr);
      return GENERIC_OK;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://thefriendshipbaptist.com";
    const resetUrl = `${siteUrl}/auth/update-password?token=${rawToken}`;
    const firstName = (profile.first_name as string) || "Friend";

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset your password — Friendship Baptist Church",
      html: getPasswordResetEmailHtml(firstName, resetUrl),
      text: getPasswordResetEmailText(firstName, resetUrl),
    }).catch((err) => {
      console.error("[EMAIL] Password reset send failed:", err);
      return { success: false as const, error: "Email delivery failed." };
    });

    console.log("[AUDIT] auth.reset_requested", {
      userId: profile.id,
      emailSent: emailResult.success,
      timestamp: new Date().toISOString(),
    });

    return GENERIC_OK;
  } catch (err) {
    console.error("[AUTH] Unexpected reset-password request error:", err);
    return GENERIC_OK;
  }
}
