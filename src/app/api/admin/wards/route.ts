import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/wards
 *
 * Fetches all wards with deacon info (joined with deacons + profiles).
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
    const { data: wards, error } = await admin
      .from("wards")
      .select("*, deacons(id, profiles(first_name, last_name))")
      .order("name", { ascending: true });

    if (error) {
      console.error("[ADMIN] Fetch wards error:", error);
      return NextResponse.json(
        { error: "Failed to fetch wards" },
        { status: 500 }
      );
    }

    return NextResponse.json({ wards: wards ?? [] });
  } catch (err) {
    console.error("[ADMIN] Wards GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/wards
 *
 * Creates a new ward.
 * Requires admin or super_admin role.
 */
export async function POST(request: Request) {
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
    const { name, description, deacon_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: ward, error } = await admin
      .from("wards")
      .insert({ name, description, deacon_id })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create ward error:", error);
      return NextResponse.json(
        { error: "Failed to create ward" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ward }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Wards POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/wards
 *
 * Updates an existing ward.
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
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("wards")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Ward not found" }, { status: 404 });
    }

    const { data: ward, error } = await admin
      .from("wards")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update ward error:", error);
      return NextResponse.json(
        { error: "Failed to update ward" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ward });
  } catch (err) {
    console.error("[ADMIN] Wards PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/wards
 *
 * Deletes a ward.
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
      .from("wards")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Ward not found" }, { status: 404 });
    }

    const { error } = await admin.from("wards").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete ward error:", error);
      return NextResponse.json(
        { error: "Failed to delete ward" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Wards DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
