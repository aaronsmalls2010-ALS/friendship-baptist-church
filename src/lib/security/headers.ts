/**
 * Security headers configuration for the Next.js application.
 *
 * These headers should be applied in next.config.ts or middleware.ts
 * to protect against common web vulnerabilities.
 */

/**
 * Build a Content-Security-Policy header value.
 *
 * @param nonce Optional nonce for inline scripts/styles. When provided,
 *   the CSP will allow inline scripts/styles with this nonce.
 * @returns The CSP header value string.
 */
export function getCSPHeader(nonce?: string): string {
  // Next.js requires 'unsafe-inline' for hydration bootstrap scripts
  // and 'unsafe-eval' for development mode / hot reload.
  // In production with nonces, we can be more restrictive.
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}'`
    : `'self' 'unsafe-inline' 'unsafe-eval'`;

  const styleSrc = nonce
    ? `'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com`
    : `'self' 'unsafe-inline' https://fonts.googleapis.com`;

  const directives = [
    // Only allow resources from same origin by default
    `default-src 'self'`,

    // Scripts: self + optional nonce for inline scripts
    `script-src ${scriptSrc}`,

    // Styles: self + unsafe-inline (needed for Tailwind) + Google Fonts
    `style-src ${styleSrc}`,

    // Images: self + data URIs (for inline images) + Supabase storage
    `img-src 'self' data: blob: https://*.supabase.co`,

    // Fonts: self + Google Fonts CDN
    `font-src 'self' https://fonts.gstatic.com`,

    // API connections: self + Supabase
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,

    // Media: self + Supabase storage
    `media-src 'self' https://*.supabase.co`,

    // Allow YouTube embeds for worship service videos
    `frame-src 'self' https://www.youtube.com https://youtube.com`,

    // Disallow embedding in frames
    `frame-ancestors 'none'`,

    // Form submissions only to same origin
    `form-action 'self'`,

    // Base URI restricted to self
    `base-uri 'self'`,

    // Block all object/embed/applet elements
    `object-src 'none'`,

    // Upgrade insecure requests in production
    `upgrade-insecure-requests`,
  ];

  return directives.join('; ');
}

/**
 * Static security headers array for use in next.config.ts.
 *
 * Usage in next.config.ts:
 * ```ts
 * const nextConfig = {
 *   async headers() {
 *     return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
 *   },
 * };
 * ```
 */
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: 'Content-Security-Policy',
    value: getCSPHeader(),
  },
  {
    // HSTS: enforce HTTPS for 2 years, include subdomains, allow preload list
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Prevent clickjacking by disallowing framing entirely
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Disable XSS auditor — modern browsers have removed it and it
    // can introduce vulnerabilities in some edge cases
    key: 'X-XSS-Protection',
    value: '0',
  },
  {
    // Send origin for same-origin requests, origin-only for cross-origin
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Disable access to sensitive browser APIs
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    // Isolate browsing context to same-origin documents
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    // Allow cross-origin resources (needed for Google Fonts, Supabase CDN)
    key: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin',
  },
];
