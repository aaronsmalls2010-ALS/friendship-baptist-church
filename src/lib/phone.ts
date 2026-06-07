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
