import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SETTING_ID = "settings.watch_live_enabled";

/**
 * GET /api/admin/settings/watch-live
 * Returns the current watch_live_enabled setting. Public access.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("content")
      .eq("id", SETTING_ID)
      .single();

    if (error || !data) {
      // Default to true when setting doesn't exist yet
      return NextResponse.json({ enabled: true }, { status: 200 });
    }

    return NextResponse.json(
      { enabled: data.content === "true" },
      { status: 200 }
    );
  } catch {
    // Supabase not configured or unreachable — default to visible
    return NextResponse.json({ enabled: true }, { status: 200 });
  }
}

/**
 * POST /api/admin/settings/watch-live
 * Toggle the watch_live_enabled setting.
 * Requires admin or super_admin role.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify admin or super_admin role
    const role =
      user.user_metadata?.role || user.app_metadata?.role || "member";
    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request: enabled (boolean) is required" },
        { status: 400 }
      );
    }

    // Use admin client for the upsert to bypass RLS
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("site_content")
      .upsert(
        {
          id: SETTING_ID,
          content: String(enabled),
          content_type: "text",
          page: "settings",
          section: "global",
          label: "Watch Live Enabled",
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Watch live setting update error:", error);
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { enabled: data.content === "true" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Settings service unavailable" },
      { status: 503 }
    );
  }
}
