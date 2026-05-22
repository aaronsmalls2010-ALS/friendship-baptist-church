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

  // Build CSP safely
  let supabaseDomain = "";
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      supabaseDomain = new URL(supabaseUrl).hostname;
    }
  } catch {
    // Ignore URL parsing errors
  }

  const connectSrc = supabaseDomain
    ? `'self' https://${supabaseDomain} wss://${supabaseDomain} https://api.supabase.co`
    : "'self'";

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

  // Rate limit auth endpoints aggressively
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const { allowed, remaining } = rateLimit(ip, 20, 15 * 60 * 1000);
    if (!allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      response.headers.set("Retry-After", "900");
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

  // Rate limit API endpoints
  if (API_PATHS.some((p) => pathname.startsWith(p))) {
    const { allowed, remaining } = rateLimit(ip, 100, 60 * 1000);
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

  // General request handling
  const { allowed } = rateLimit(ip, 200, 60 * 1000);
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
