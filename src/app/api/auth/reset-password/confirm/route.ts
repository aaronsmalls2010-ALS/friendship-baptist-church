import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/reset-password/confirm
 * Body: { token: string, password: string }
 *
 * Verifies a one-time reset token (matched by hash, checked against expiry),
 * sets the new password, and consumes the token. Verifying the emailed link
 * also confirms email ownership, so we mark the account verified + approved.
 */

function hashToken(raw: string): string {
  const pepper = (process.env.OTP_PEPPER ?? "").trim();
  return createHash("sha256").update(`${raw}:${pepper}`).digest("hex");
}

function passwordProblem(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 12)
    return "Password must be at least 12 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(pw))
    return "Password must contain a special character.";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = (body?.token ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    // 64 hex chars = randomBytes(32).toString("hex")
    if (!token || !/^[0-9a-f]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const pwError = passwordProblem(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    const admin = createAdminClient();
    const tokenHash = hashToken(token);

    // Supabase Admin API can't query by metadata, so we page through users and
    // match the stored hash — same approach as email verification. Fine at a
    // church's scale.
    const { data: usersResponse, error: listError } =
      await admin.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      console.error("[AUTH] reset-confirm listUsers failed:", listError);
      return NextResponse.json(
        { error: "Something went wrong. Please request a new reset link." },
        { status: 500 }
      );
    }

    const matched = usersResponse.users.find(
      (u) => u.user_metadata?.password_reset_token_hash === tokenHash
    );

    if (!matched) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    // Expiry check.
    const expiresRaw = matched.user_metadata?.password_reset_expires as
      | string
      | undefined;
    const expired =
      !expiresRaw || Number.isNaN(Date.parse(expiresRaw))
        ? true
        : Date.parse(expiresRaw) < Date.now();

    if (expired) {
      // Clear the stale token so it can't linger.
      const meta = { ...(matched.user_metadata || {}) };
      delete meta.password_reset_token_hash;
      delete meta.password_reset_expires;
      await admin.auth.admin.updateUserById(matched.id, {
        user_metadata: meta,
      });
      return NextResponse.json(
        {
          error:
            "This reset link has expired. Please request a new one from the sign-in page.",
        },
        { status: 400 }
      );
    }

    // Set the new password AND consume the token in one update.
    const meta = { ...(matched.user_metadata || {}) };
    delete meta.password_reset_token_hash;
    delete meta.password_reset_expires;

    const { error: updateErr } = await admin.auth.admin.updateUserById(
      matched.id,
      { password, user_metadata: meta }
    );
    if (updateErr) {
      console.error("[AUTH] reset-confirm password update failed:", updateErr);
      return NextResponse.json(
        { error: "Could not update your password. Please try again." },
        { status: 500 }
      );
    }

    // Clicking the emailed link proves control of the email → activate account.
    await admin
      .from("profiles")
      .update({ is_email_verified: true, is_approved: true })
      .eq("id", matched.id);

    console.log("[AUDIT] auth.password_reset", {
      userId: matched.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Your password has been updated. You can now sign in.",
    });
  } catch (err) {
    console.error("[AUTH] Unexpected reset-confirm error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
