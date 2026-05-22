import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/family
 *
 * Returns the authenticated user's family group and all its members.
 * If the user has no family, returns { family: null, members: [] }.
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

    // Look up user's family_id from their profile
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[PORTAL] Fetch profile for family error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    if (!profile.family_id) {
      return NextResponse.json({ family: null, members: [] });
    }

    // Fetch the family record
    const { data: family, error: familyError } = await admin
      .from("families")
      .select("*")
      .eq("id", profile.family_id)
      .single();

    if (familyError) {
      console.error("[PORTAL] Fetch family error:", familyError);
      return NextResponse.json(
        { error: "Failed to fetch family" },
        { status: 500 }
      );
    }

    // Fetch all family members joined with their profiles
    const { data: members, error: membersError } = await admin
      .from("family_members")
      .select("*, profiles(id, first_name, last_name, email, phone, photo_url)")
      .eq("family_id", profile.family_id);

    if (membersError) {
      console.error("[PORTAL] Fetch family members error:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch family members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ family, members: members ?? [] });
  } catch (err) {
    console.error("[PORTAL] Family GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/family
 *
 * Creates a new family for the authenticated user.
 * The user becomes the family "head".
 * Fails if the user already belongs to a family.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { family_name } = body;

    if (!family_name || typeof family_name !== "string" || !family_name.trim()) {
      return NextResponse.json(
        { error: "family_name is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if user already has a family
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[PORTAL] Fetch profile for family creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    if (profile.family_id) {
      return NextResponse.json(
        { error: "You already belong to a family" },
        { status: 409 }
      );
    }

    // Create the family record
    const { data: family, error: familyError } = await admin
      .from("families")
      .insert({ family_name: family_name.trim() })
      .select("*")
      .single();

    if (familyError) {
      console.error("[PORTAL] Create family error:", familyError);
      return NextResponse.json(
        { error: "Failed to create family" },
        { status: 500 }
      );
    }

    // Create the family_member record with relationship "head"
    const { error: memberError } = await admin
      .from("family_members")
      .insert({
        family_id: family.id,
        profile_id: user.id,
        relationship: "head",
      });

    if (memberError) {
      console.error("[PORTAL] Create family member (head) error:", memberError);
      // Attempt cleanup of orphaned family
      await admin.from("families").delete().eq("id", family.id);
      return NextResponse.json(
        { error: "Failed to add you as family head" },
        { status: 500 }
      );
    }

    // Update user's profile with family_id
    const { error: updateError } = await admin
      .from("profiles")
      .update({ family_id: family.id, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      console.error("[PORTAL] Update profile family_id error:", updateError);
      return NextResponse.json(
        { error: "Family created but failed to link profile" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] family.create", {
      familyId: family.id,
      createdBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ family }, { status: 201 });
  } catch (err) {
    console.error("[PORTAL] Family POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
