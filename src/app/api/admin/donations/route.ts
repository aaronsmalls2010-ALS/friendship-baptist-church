import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/donations
 *
 * Fetches all donations with profile info (donor name).
 * Uses admin client which bypasses RLS.
 * Requires admin or super_admin role.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: donations, error } = await admin
      .from("donations")
      .select("id, amount, type, campaign, created_at, profile_id, profiles(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch donations error:", error);
      return NextResponse.json(
        { error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ donations: donations ?? [] });
  } catch (err) {
    console.error("[ADMIN] Donations GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
