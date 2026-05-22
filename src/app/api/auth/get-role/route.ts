import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/auth/get-role
 *
 * Returns the authenticated user's role and syncs it to user_metadata
 * if it's missing (e.g., for accounts created before role was stored
 * in metadata). This ensures middleware role checks work correctly.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if role already exists in metadata
    let role = user.user_metadata?.role || user.app_metadata?.role;

    if (!role) {
      // Role not in metadata — fetch from profiles table and sync
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      role = profile?.role || "member";

      // Persist the role to user_metadata so middleware and future checks work
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role },
      });
    }

    return NextResponse.json({ role });
  } catch (err) {
    console.error("[AUTH] Get role error:", err);
    return NextResponse.json(
      { error: "Failed to get role" },
      { status: 500 }
    );
  }
}
