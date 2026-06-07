import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateOtp,
  hashOtp,
  otpExpiry,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_SENDS_PER_HOUR,
} from "@/lib/otp";
import { sendSms } from "@/lib/sms/send";
import { toE164 } from "@/lib/phone";

type IssueResult =
  | { ok: true }
  | { ok: false; status: number; error: string; retryAfter?: number };

/**
 * Generate a fresh phone OTP, persist its hash, and text it to the member.
 *
 * Enforces anti-abuse limits against the `phone_verifications` history:
 *   - a 60s cooldown between sends to the same number, and
 *   - a hard cap of 5 sends per number per rolling hour.
 *
 * Must be called with a service-role (admin) Supabase client — the
 * phone_verifications table is RLS-locked to service role only.
 */
export async function issuePhoneOtp(
  admin: SupabaseClient,
  userId: string,
  rawPhone: string,
  purpose: "signup" | "login" = "signup"
): Promise<IssueResult> {
  const phone = toE164(rawPhone);
  if (!phone) {
    return { ok: false, status: 400, error: "Invalid phone number." };
  }

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  // Inspect recent sends to this number for rate-limiting.
  const { data: recent } = await admin
    .from("phone_verifications")
    .select("created_at")
    .eq("phone", phone)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false });

  if (recent && recent.length > 0) {
    const lastSent = new Date(recent[0].created_at).getTime();
    const sinceLast = now - lastSent;
    if (sinceLast < OTP_RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((OTP_RESEND_COOLDOWN_MS - sinceLast) / 1000);
      return {
        ok: false,
        status: 429,
        error: `Please wait ${retryAfter} seconds before requesting another code.`,
        retryAfter,
      };
    }
    if (recent.length >= OTP_MAX_SENDS_PER_HOUR) {
      return {
        ok: false,
        status: 429,
        error:
          "Too many verification codes requested. Please try again in an hour.",
        retryAfter: 3600,
      };
    }
  }

  const code = generateOtp();

  // Invalidate any still-open codes for this user/purpose before issuing a new one.
  await admin
    .from("phone_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const { error: insertError } = await admin.from("phone_verifications").insert({
    user_id: userId,
    phone,
    code_hash: hashOtp(code),
    purpose,
    expires_at: otpExpiry(),
  });

  if (insertError) {
    console.error("[OTP] Failed to store verification code:", insertError);
    return {
      ok: false,
      status: 500,
      error: "Could not start phone verification. Please try again.",
    };
  }

  const sms = await sendSms(
    phone,
    `Your Friendship Baptist Church verification code is ${code}. It expires in 10 minutes.`
  );

  if (!sms.success) {
    return {
      ok: false,
      status: sms.code === "NOT_CONFIGURED" ? 503 : 502,
      error:
        sms.code === "NOT_CONFIGURED"
          ? "Text-message verification is temporarily unavailable. Please register with an email instead."
          : "We couldn't send your verification text. Please check the number and try again.",
    };
  }

  return { ok: true };
}
