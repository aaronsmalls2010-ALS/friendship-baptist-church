import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";

  // Validate the redirect destination to prevent open redirect attacks.
  // Only allow relative paths that start with '/'.
  const isValidRedirect =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
  const redirectTo = isValidRedirect ? next : "/portal";

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
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
