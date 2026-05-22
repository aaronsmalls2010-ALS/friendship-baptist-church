/**
 * CSRF (Cross-Site Request Forgery) protection utilities.
 *
 * For Next.js App Router, CSRF tokens should be:
 * - Generated server-side and embedded in forms or sent via response headers
 * - Submitted with state-changing requests (POST, PUT, DELETE)
 * - Validated in API routes or Server Actions before processing
 */

/**
 * Generate a cryptographically secure CSRF token.
 * Uses crypto.randomUUID() which is available in Node.js 19+,
 * modern browsers, and Edge Runtime.
 */
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

/**
 * Validate a CSRF token against the stored token using constant-time comparison.
 *
 * Constant-time comparison prevents timing attacks where an attacker
 * could determine how many characters of the token are correct based
 * on response time differences.
 *
 * @param token The token submitted with the request
 * @param storedToken The token stored in the session/cookie
 * @returns true if the tokens match
 */
export function validateCSRFToken(
  token: string,
  storedToken: string
): boolean {
  if (!token || !storedToken) return false;
  if (typeof token !== 'string' || typeof storedToken !== 'string') return false;

  // Tokens must be the same length for constant-time comparison
  if (token.length !== storedToken.length) return false;

  // Use constant-time comparison to prevent timing attacks
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);
  const storedBytes = encoder.encode(storedToken);

  if (tokenBytes.length !== storedBytes.length) return false;

  // XOR each byte and accumulate — any difference sets result to non-zero
  let mismatch = 0;
  for (let i = 0; i < tokenBytes.length; i++) {
    mismatch |= tokenBytes[i] ^ storedBytes[i];
  }

  return mismatch === 0;
}

/**
 * Create a CSRF token and return it along with cookie options
 * suitable for Next.js middleware or API routes.
 *
 * Usage in a Server Action or API route:
 * ```ts
 * const { token, cookieOptions } = createCSRFTokenWithCookie();
 * cookies().set('csrf-token', token, cookieOptions);
 * ```
 */
export function createCSRFTokenWithCookie(): {
  token: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict';
    path: string;
    maxAge: number;
  };
} {
  const token = generateCSRFToken();

  return {
    token,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60, // 1 hour
    },
  };
}
