import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
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
    // Verify authentication + role (admin / super_admin only — NOT pastor).
    // Roles are sourced from the DB, not self-writable user_metadata.
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!auth.ctx.has("admin", "super_admin")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    const user = auth.user;

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
