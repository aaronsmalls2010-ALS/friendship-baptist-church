import type { NextConfig } from "next";

// Build CSP inline (avoid importing TS from src at config level)
// Next.js requires 'unsafe-inline' + 'unsafe-eval' for hydration and HMR
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "media-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // ── Image optimization ──
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ── Security headers (applied to all routes) ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy — prevent XSS
          { key: "Content-Security-Policy", value: cspDirectives },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME type sniffing attacks
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disable legacy XSS auditor (can introduce vulnerabilities)
          { key: "X-XSS-Protection", value: "0" },
          // Control referrer information sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict powerful browser features
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          // Force HTTPS for 2 years with preload
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent cross-origin information leakage
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          // DNS prefetch control
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      // Cache control for static assets
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Prevent caching of auth pages
      {
        source: "/auth/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      // Prevent caching of portal/admin pages
      {
        source: "/portal/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/admin/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },

  // ── Redirects for security ──
  async redirects() {
    return [
      // Redirect common attack paths to 404
      { source: "/wp-admin", destination: "/not-found", permanent: false },
      { source: "/wp-admin/:path*", destination: "/not-found", permanent: false },
      { source: "/wp-login.php", destination: "/not-found", permanent: false },
      { source: "/wp-content/:path*", destination: "/not-found", permanent: false },
      { source: "/xmlrpc.php", destination: "/not-found", permanent: false },
      { source: "/.env", destination: "/not-found", permanent: false },
      { source: "/.env.local", destination: "/not-found", permanent: false },
      { source: "/phpmyadmin", destination: "/not-found", permanent: false },
      { source: "/admin.php", destination: "/not-found", permanent: false },
    ];
  },

  // ── Powered-by header removal ──
  poweredByHeader: false,

  // ── Strict mode for React ──
  reactStrictMode: true,
};

export default nextConfig;
