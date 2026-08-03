import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * GET /api/admin/sms/status
 * Reports whether Twilio is configured AND whether the credentials actually
 * work — it makes a live authenticated Twilio call to validate the SID/token
 * and confirm the FROM number is owned by the account. Admin+ only. Never
 * returns the auth token.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const present = {
    account_sid: Boolean(accountSid),
    auth_token: Boolean(authToken),
    phone_number: Boolean(fromNumber),
  };
  const configured = present.account_sid && present.auth_token && present.phone_number;

  if (!configured) {
    return NextResponse.json({
      configured: false,
      valid: false,
      present,
      message: "Twilio is not fully configured. Missing: " +
        Object.entries(present).filter(([, v]) => !v).map(([k]) => k.toUpperCase()).join(", "),
    });
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid!, authToken!);

    // Validate the credentials (throws 401 if wrong).
    const account = await client.api.v2010.accounts(accountSid!).fetch();

    // Confirm the FROM number is actually owned by this account.
    let numberOwned = false;
    try {
      const nums = await client.incomingPhoneNumbers.list({ phoneNumber: fromNumber!, limit: 1 });
      numberOwned = nums.length > 0;
    } catch {
      numberOwned = false;
    }

    console.log("[SMS-STATUS] valid=true", {
      from: fromNumber,
      account_status: account.status,
      number_owned: numberOwned,
    });
    return NextResponse.json({
      configured: true,
      valid: true,
      present,
      from_number: fromNumber,
      account_status: account.status, // "active" when the account is live
      number_owned: numberOwned,
      message: numberOwned
        ? "Connected — credentials valid and the sending number is on this account."
        : "Credentials valid, but the FROM number isn't found on this account. Check TWILIO_PHONE_NUMBER is exactly the Twilio number in E.164 (e.g. +18435551234).",
    });
  } catch (err) {
    const e = err as { status?: number; message?: string; code?: number };
    console.log("[SMS-STATUS] valid=false", { status: e.status, code: e.code, message: e.message });
    return NextResponse.json({
      configured: true,
      valid: false,
      present,
      from_number: fromNumber,
      message:
        e.status === 401 || e.code === 20003
          ? "Twilio rejected the credentials (401). Double-check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
          : `Could not validate with Twilio: ${e.message ?? "unknown error"}`,
    });
  }
}
