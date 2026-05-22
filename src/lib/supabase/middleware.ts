import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// Strip BOM (U+FEFF) that can sneak into env vars via copy-paste
const BOM_RE = new RegExp("^" + String.fromCharCode(0xfeff));
function cleanEnv(val: string | undefined): string {
  return (val ?? "").replace(BOM_RE, "").trim();
}

// Admin client for role lookups (bypasses RLS)
function getAdminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Helper: look up role from profiles table via admin client
async function getRoleFromDb(userId: string): Promise<string | undefined> {
  try {
    const admin = getAdminClient();
    if (!admin) return undefined;
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    return data?.role;
  } catch {
    return undefined;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
        // IMPORTANT: Pass through Supabase's own cookie options unchanged.
        // Do NOT override with httpOnly/secure/sameSite — doing so prevents
        // the browser Supabase client from reading its own auth cookies.
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session
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

    if (!role) {
      role = await getRoleFromDb(user.id);
    }

    const isAdminUser = role === "admin" || role === "super_admin";

    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      if (isAdminUser && redirect.startsWith("/portal")) {
        url.pathname = "/admin";
      } else {
        url.pathname = redirect;
      }
    } else {
      url.pathname = isAdminUser ? "/admin" : "/portal/profile";
    }
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ── Admin role check ──
  if (isAdminRoute && user) {
    let role = user.user_metadata?.role || user.app_metadata?.role;

    if (!role) {
      role = await getRoleFromDb(user.id);
    }

    if (role !== "admin" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/profile";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
