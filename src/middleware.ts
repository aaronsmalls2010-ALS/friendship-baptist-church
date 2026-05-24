import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SECURITY_HEADERS } from "@/lib/security/headers";

/**
 * Apply security headers to every response.
 * Auth session management only runs for protected routes.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith("/portal") || pathname.startsWith("/admin");

  // For protected routes, run session management (which may redirect)
  let response: NextResponse;
  if (isProtectedRoute || pathname.startsWith("/auth")) {
    response = await updateSession(request);
  } else {
    response = NextResponse.next();
  }

  // Apply security headers to every response
  for (const { key, value } of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Static assets in /images
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/).*)",
  ],
};
