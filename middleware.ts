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

// ─── Path Patterns ───────────────────────────────────────────────────────
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/reset-password"];
const API_PATHS = ["/api/"];

// ─── Main Middleware ─────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isApi = API_PATHS.some((p) => pathname.startsWith(p));

  // ── Rate limiting ──
  if (isAuth) {
    const { allowed } = rateLimit(`auth:${ip}`, 120, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }
  } else if (isApi) {
    const { allowed } = rateLimit(`api:${ip}`, 300, 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  } else {
    const { allowed } = rateLimit(`page:${ip}`, 500, 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // ── Session management + route protection ──
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/).*)",
  ],
};
