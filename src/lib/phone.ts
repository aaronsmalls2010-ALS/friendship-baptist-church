/**
 * Phone number helpers — US-focused, E.164 normalization.
 *
 * Shared by signup, login, OTP verification, and admin SMS broadcasts so that
 * every part of the app formats and validates numbers identically.
 */

/**
 * Normalize a US phone number to E.164 format (e.g. "+18435550123").
 * Returns null when the input cannot be a valid US number.
 */
export function toE164(input: string | null | undefined): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // Already E.164 (+ followed by 7–15 digits) — accept as-is.
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  // 10-digit US number → prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11-digit US number starting with country code 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

/** True when the input normalizes to a valid US (or E.164) phone number. */
export function isValidUsPhone(input: string | null | undefined): boolean {
  return toE164(input) !== null;
}

/** Heuristic: does this identifier look like an email (vs. a phone)? */
export function looksLikeEmail(input: string): boolean {
  return input.includes("@");
}

/**
 * Internal domain used for the stand-in email identity of phone-only members.
 * These addresses are never shown to users and never receive mail — they exist
 * only so Supabase Auth (which authenticates by email) has an identity to bind
 * the password to. Phone login resolves a phone number to this address
 * server-side.
 */
export const PHONE_IDENTITY_DOMAIN = "phone.thefriendshipbaptist.com";

/**
 * Build the stand-in auth email for a phone-only signup, e.g.
 * "+18435550123" → "phone_18435550123@phone.thefriendshipbaptist.com".
 * Returns null if the phone can't be normalized.
 */
export function syntheticEmailForPhone(
  input: string | null | undefined
): string | null {
  const e164 = toE164(input);
  if (!e164) return null;
  return `phone_${e164.replace(/\D/g, "")}@${PHONE_IDENTITY_DOMAIN}`;
}

/** True if an email is one of our internal phone stand-in identities. */
export function isSyntheticPhoneEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PHONE_IDENTITY_DOMAIN}`);
}

/**
 * Format an E.164 / raw US number for display, e.g. "+18435550123" →
 * "(843) 555-0123". Falls back to the original string if it can't be parsed.
 */
export function formatUsPhoneForDisplay(input: string): string {
  const e164 = toE164(input);
  if (!e164) return input;
  const national = e164.replace(/^\+1/, "");
  if (national.length !== 10) return input;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

/** Mask a phone for confirmation messages, e.g. "+18435550123" → "(•••) •••-0123". */
export function maskPhone(input: string): string {
  const e164 = toE164(input);
  const national = (e164 ?? input).replace(/^\+1/, "").replace(/\D/g, "");
  const last4 = national.slice(-4);
  return `(•••) •••-${last4}`;
}
