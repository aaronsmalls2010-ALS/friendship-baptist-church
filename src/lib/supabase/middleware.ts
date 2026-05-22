import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, allow all requests (development without Supabase)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...(options as Record<string, unknown>),
            // Enforce secure cookie settings
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })
        );
      },
    },
  });

  // Refresh the session — important for keeping tokens fresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPortalRoute = pathname.startsWith("/portal");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/auth");

  // ── Protect portal and admin routes ──
  if ((isPortalRoute || isAdminRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── Redirect authenticated users away from auth pages ──
  if (isAuthRoute && user && !pathname.startsWith("/auth/callback")) {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const url = request.nextUrl.clone();
    let role = user.user_metadata?.role || user.app_metadata?.role;

    // Fallback: check profiles table if role isn't in JWT yet
    if (!role) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        role = profile?.role;
      } catch {
        // Continue with undefined role
      }
    }

    const isAdminUser = role === "admin" || role === "super_admin";

    // Validate redirect path — only allow relative paths to prevent open redirect
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      // Override portal redirect for admin users — they belong on /admin
      if (isAdminUser && redirect.startsWith("/portal")) {
        url.pathname = "/admin";
      } else {
        url.pathname = redirect;
      }
    } else {
      url.pathname = isAdminUser ? "/admin" : "/portal";
    }
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ── Admin role check ──
  if (isAdminRoute && user) {
    let role = user.user_metadata?.role || user.app_metadata?.role;

    // If role isn't in JWT metadata yet (e.g. right after login before refresh),
    // check the profiles table directly as a fallback before blocking access
    if (!role) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        role = profile?.role;
      } catch {
        // If profile lookup fails, fall through to the redirect below
      }
    }

    if (role !== "admin" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
