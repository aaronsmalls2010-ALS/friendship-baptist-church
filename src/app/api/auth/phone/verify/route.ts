import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOtp, OTP_MAX_ATTEMPTS } from "@/lib/otp";

/**
 * POST /api/auth/phone/verify
 *
 * Verify the 6-digit SMS code for a pending phone registration.
 * Body: { userId, code }.
 *
 * On success: marks the profile phone-verified and approved (auto-approve once
 * verified). On failure: increments the attempt counter and invalidates the
 * code once the attempt cap is reached.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing account reference." }, { status: 400 });
    }
    if (!code || !/^\d{6}$/.test(String(code))) {
      return NextResponse.json(
        { error: "Enter the 6-digit code from your text message." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Most recent unconsumed code for this account.
    const { data: record } = await admin
      .from("phone_verifications")
      .select("id, code_hash, attempts, expires_at, consumed_at")
      .eq("user_id", userId)
      .eq("purpose", "signup")
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return NextResponse.json(
        { error: "No active verification code. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      await admin
        .from("phone_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", record.id);
      return NextResponse.json(
        { error: "That code has expired. Please request a new one.", expired: true },
        { status: 400 }
      );
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await admin
        .from("phone_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", record.id);
      return NextResponse.json(
        {
          error: "Too many incorrect attempts. Please request a new code.",
          locked: true,
        },
        { status: 429 }
      );
    }

    if (!verifyOtp(String(code), record.code_hash)) {
      const attempts = record.attempts + 1;
      await admin
        .from("phone_verifications")
        .update({ attempts })
        .eq("id", record.id);

      const remaining = OTP_MAX_ATTEMPTS - attempts;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // ── Success ──
    await admin
      .from("phone_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", record.id);

    const { error: updateError } = await admin
      .from("profiles")
      .update({ is_phone_verified: true, is_approved: true })
      .eq("id", userId);

    if (updateError) {
      console.error("[AUTH] phone verify profile update failed:", updateError);
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 500 }
      );
    }

    console.log("[AUDIT] auth.phone_verified", {
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Phone verified! Your account is ready.", verified: true },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AUTH] phone/verify error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
