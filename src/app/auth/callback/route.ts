import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Validate the redirect destination to prevent open redirect attacks.
  const isValidRedirect =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\");

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Determine redirect: explicit valid path > role-based default
        let redirectTo = "/portal";
        if (isValidRedirect) {
          redirectTo = next;
        } else {
          // Check user role for smart default
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const role =
            user?.user_metadata?.role || user?.app_metadata?.role;
          if (role === "admin" || role === "super_admin") {
            redirectTo = "/admin";
          }
        }

        return NextResponse.redirect(new URL(redirectTo, origin));
      }
    } catch {
      // Fall through to error redirect below
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=auth_callback_error", origin)
  );
}
