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

  // Periodically clean up expired entries
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
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Build CSP — use wildcard for Supabase to avoid edge runtime env var issues
  const connectSrc = "'self' https://*.supabase.co wss://*.supabase.co https://api.supabase.co";

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    `connect-src ${connectSrc}`,
    "frame-src https://www.google.com/maps/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  return response;
}

// ─── Path Patterns ───────────────────────────────────────────────────────
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/reset-password"];
const API_PATHS = ["/api/"];

// ─── Main Middleware ─────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Rate limit by path type — each gets its own counter (prefixed key)
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isApi = API_PATHS.some((p) => pathname.startsWith(p));

  if (isAuth) {
    // Auth pages: 120 requests per 5 minutes (page loads, redirects, etc.)
    // Actual login/signup attempts are separately rate-limited in their API routes
    const { allowed, remaining } = rateLimit(`auth:${ip}`, 120, 5 * 60 * 1000);
    if (!allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429 }
      );
      response.headers.set("Retry-After", "300");
      return addSecurityHeaders(response);
    }

    try {
      const response = await updateSession(request);
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      return addSecurityHeaders(response);
    } catch {
      const response = NextResponse.next();
      return addSecurityHeaders(response);
    }
  }

  if (isApi) {
    // API endpoints: 300 requests per minute
    const { allowed, remaining } = rateLimit(`api:${ip}`, 300, 60 * 1000);
    if (!allowed) {
      const response = NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429 }
      );
      response.headers.set("Retry-After", "60");
      return addSecurityHeaders(response);
    }

    try {
      const response = await updateSession(request);
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      return addSecurityHeaders(response);
    } catch {
      const response = NextResponse.next();
      return addSecurityHeaders(response);
    }
  }

  // General page requests: 500 per minute
  const { allowed } = rateLimit(`page:${ip}`, 500, 60 * 1000);
  if (!allowed) {
    const response = NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
    response.headers.set("Retry-After", "60");
    return addSecurityHeaders(response);
  }

  try {
    const response = await updateSession(request);
    return addSecurityHeaders(response);
  } catch {
    // If Supabase session update fails, still serve the page with security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/).*)",
  ],
};
