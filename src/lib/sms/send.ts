import { toE164 } from "@/lib/phone";

/**
 * Send a single SMS via Twilio.
 *
 * Server-side only. Reads TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_PHONE_NUMBER from the environment. Returns a discriminated result so
 * callers can surface a clean message instead of throwing.
 */
export async function sendSms(
  to: string,
  body: string
): Promise<{ success: true } | { success: false; error: string; code?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "SMS service is not configured.",
      code: "NOT_CONFIGURED",
    };
  }

  const toE164Number = toE164(to);
  if (!toE164Number) {
    return { success: false, error: "Invalid phone number.", code: "INVALID_TO" };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    await client.messages.create({
      body,
      from: fromNumber,
      to: toE164Number,
    });
    return { success: true };
  } catch (err) {
    console.error("[SMS] send failed:", err);
    return {
      success: false,
      error: "Failed to send text message.",
      code: "SEND_FAILED",
    };
  }
}

/** True when Twilio credentials are present in the environment. */
export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}
