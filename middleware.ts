import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ─── Rate Limiting (in-memory, edge-compatible) ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Periodically clean up expired entries (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining };
}

// ─── Security Headers ────────────────────────────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Strict Transport Security — force HTTPS for 2 years, include subdomains
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // Prevent cross-origin information leakage
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Content Security Policy
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : "";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://*.supabase.co`,
    `connect-src 'self' https://${supabaseDomain} wss://${supabaseDomain} https://api.supabase.co`,
    `frame-src https://www.google.com/maps/`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Remove server identification headers
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  return response;
}

// ─── Path Patterns ───────────────────────────────────────────────────────
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/reset-password"];
const API_PATHS = ["/api/"];
const STATIC_PATHS = ["/_next/", "/images/", "/favicon"];

function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some((p) => pathname.startsWith(p));
}

// ─── Main Middleware ─────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets entirely
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Get client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // ── Rate limit auth endpoints more aggressively ──
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const { allowed, remaining } = rateLimit(ip, 20, 15 * 60 * 1000); // 20 requests per 15 min
    if (!allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      response.headers.set("Retry-After", "900");
      response.headers.set("X-RateLimit-Remaining", "0");
      return addSecurityHeaders(response);
    }

    const response = await updateSession(request);
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return addSecurityHeaders(response);
  }

  // ── Rate limit API endpoints ──
  if (API_PATHS.some((p) => pathname.startsWith(p))) {
    const { allowed, remaining } = rateLimit(ip, 100, 60 * 1000); // 100 requests per minute
    if (!allowed) {
      const response = NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429 }
      );
      response.headers.set("Retry-After", "60");
      return addSecurityHeaders(response);
    }

    const response = await updateSession(request);
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return addSecurityHeaders(response);
  }

  // ── General request handling ──
  const { allowed } = rateLimit(ip, 200, 60 * 1000); // 200 requests per minute for general browsing
  if (!allowed) {
    const response = NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
    response.headers.set("Retry-After", "60");
    return addSecurityHeaders(response);
  }

  // Run Supabase session management (handles auth redirects)
  const response = await updateSession(request);
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
