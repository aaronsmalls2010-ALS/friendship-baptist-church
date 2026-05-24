import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Fields the user is allowed to update on their own profile. */
const ALLOWED_FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "date_of_birth",
  "gender",
  "about_bio",
  "emergency_contact_name",
  "emergency_contact_phone",
  "anniversary",
  "baptism_date",
  "ward_id",
  "photo_url",
] as const;

/**
 * GET /api/portal/profile
 *
 * Returns the authenticated user's own profile.
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

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[PORTAL] Fetch profile error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[PORTAL] Profile GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portal/profile
 *
 * Updates the authenticated user's own profile.
 * Only the fields listed in ALLOWED_FIELDS can be changed.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("[PORTAL] Update profile error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] profile.update", {
      userId: user.id,
      fields: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[PORTAL] Profile PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
