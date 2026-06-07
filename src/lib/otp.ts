import { createHash, randomInt } from "crypto";

/**
 * One-time-password (OTP) helpers for phone verification.
 *
 * Codes are 6 numeric digits. We NEVER store the plaintext code — only a
 * salted SHA-256 hash (salt = OTP_PEPPER env var). Verification re-hashes the
 * submitted code and compares.
 */

// ── Tunable policy ──────────────────────────────────────────────────────────
export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong-code guesses before invalidation
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // min gap between sends to one phone
export const OTP_MAX_SENDS_PER_HOUR = 5; // hourly send cap per phone (anti-toll-fraud)

/** Generate a cryptographically-random 6-digit code as a zero-padded string. */
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

/**
 * Hash an OTP for storage/comparison. Combines the code with a server-side
 * pepper so a leaked DB row can't be brute-forced offline without the pepper.
 */
export function hashOtp(code: string): string {
  const pepper = (process.env.OTP_PEPPER ?? "").trim();
  return createHash("sha256").update(`${code}:${pepper}`).digest("hex");
}

/** Constant-time-ish comparison of a submitted code against a stored hash. */
export function verifyOtp(code: string, storedHash: string): boolean {
  const candidate = hashOtp(code);
  if (candidate.length !== storedHash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < candidate.length; i++) {
    mismatch |= candidate.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return mismatch === 0;
}

/** ISO timestamp for when a freshly-generated code should expire. */
export function otpExpiry(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}
