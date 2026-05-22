import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/logout
 * Signs out the current user and clears the session.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get user before signing out (for audit log)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[AUTH] Logout error:", error.message);
      return NextResponse.json(
        { error: "Failed to sign out." },
        { status: 500 }
      );
    }

    // Audit log
    if (user) {
      console.log("[AUDIT] auth.logout", {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { message: "Signed out successfully." },
      {
        status: 200,
        headers: {
          // Clear any cached auth state
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Clear-Site-Data": '"cookies", "storage"',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
