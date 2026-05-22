import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/cms
 * Returns all site_content rows. Public access (content is readable by everyone).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("site_content").select("*");

    if (error) {
      console.error("CMS fetch error:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch {
    // Supabase not configured or unreachable
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * PATCH /api/cms
 * Updates a single content item. Requires super_admin authentication.
 */
export async function PATCH(request: NextRequest) {
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

    // Verify super_admin role
    const role =
      user.user_metadata?.role || user.app_metadata?.role || "member";
    if (role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, content } = body;

    if (!id || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid request: id and content are required" },
        { status: 400 }
      );
    }

    // Upsert the content
    const { data, error } = await supabase
      .from("site_content")
      .upsert(
        {
          id,
          content,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("CMS update error:", error);
      return NextResponse.json(
        { error: "Failed to update content" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    // Supabase not configured or unreachable
    return NextResponse.json(
      { error: "CMS service unavailable" },
      { status: 503 }
    );
  }
}
