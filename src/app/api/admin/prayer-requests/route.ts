import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/prayer-requests
 *
 * Fetches all prayer requests ordered by created_at desc (all statuses).
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
    const { data: prayerRequests, error } = await admin
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch prayer requests error:", error);
      return NextResponse.json(
        { error: "Failed to fetch prayer requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prayer_requests: prayerRequests ?? [] });
  } catch (err) {
    console.error("[ADMIN] Prayer requests GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/prayer-requests
 *
 * Updates a prayer request status.
 * Requires admin or super_admin role.
 */
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("prayer_requests")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Prayer request not found" }, { status: 404 });
    }

    const { data: prayerRequest, error } = await admin
      .from("prayer_requests")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update prayer request error:", error);
      return NextResponse.json(
        { error: "Failed to update prayer request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prayer_request: prayerRequest });
  } catch (err) {
    console.error("[ADMIN] Prayer requests PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prayer-requests
 *
 * Deletes a prayer request.
 * Requires admin or super_admin role.
 */
export async function DELETE(request: Request) {
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("prayer_requests")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Prayer request not found" }, { status: 404 });
    }

    const { error } = await admin.from("prayer_requests").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete prayer request error:", error);
      return NextResponse.json(
        { error: "Failed to delete prayer request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Prayer requests DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
