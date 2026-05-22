import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/members
 *
 * Fetches all member profiles from Supabase.
 * Requires the caller to be an admin or super_admin.
 */
export async function GET() {
  try {
    // Verify caller is admin
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

    // Fetch all profiles using admin client
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, photo_url, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch members error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: profiles ?? [] });
  } catch (err) {
    console.error("[ADMIN] Members error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
