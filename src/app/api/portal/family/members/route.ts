import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Helper: verify the caller is the "head" of their family.
 * Returns { familyId } on success or a NextResponse error.
 */
async function verifyFamilyHead(userId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("family_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.family_id) {
    return { error: "You do not belong to a family", status: 400 };
  }

  const { data: headRecord, error: headError } = await admin
    .from("family_members")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("profile_id", userId)
    .eq("relationship", "head")
    .single();

  if (headError || !headRecord) {
    return { error: "Only the family head can manage members", status: 403 };
  }

  return { familyId: profile.family_id };
}

/**
 * POST /api/portal/family/members
 *
 * Adds a member to the caller's family.
 * Body: { profile_id: string, relationship: string }
 * Only the family head can add members.
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
    const { profile_id, relationship } = body;

    if (!profile_id || typeof profile_id !== "string") {
      return NextResponse.json(
        { error: "profile_id is required" },
        { status: 400 }
      );
    }

    if (!relationship || typeof relationship !== "string") {
      return NextResponse.json(
        { error: "relationship is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify caller is family head
    const headCheck = await verifyFamilyHead(user.id, admin);
    if ("error" in headCheck) {
      return NextResponse.json(
        { error: headCheck.error },
        { status: headCheck.status }
      );
    }

    const { familyId } = headCheck;

    // Check that the target profile exists
    const { data: targetProfile, error: targetError } = await admin
      .from("profiles")
      .select("id, family_id")
      .eq("id", profile_id)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (targetProfile.family_id) {
      return NextResponse.json(
        { error: "That member already belongs to a family" },
        { status: 409 }
      );
    }

    // Add family_member record
    const { data: member, error: memberError } = await admin
      .from("family_members")
      .insert({
        family_id: familyId,
        profile_id,
        relationship: relationship.trim(),
      })
      .select("*")
      .single();

    if (memberError) {
      console.error("[PORTAL] Add family member error:", memberError);
      return NextResponse.json(
        { error: "Failed to add family member" },
        { status: 500 }
      );
    }

    // Update the added profile's family_id
    const { error: updateError } = await admin
      .from("profiles")
      .update({ family_id: familyId, updated_at: new Date().toISOString() })
      .eq("id", profile_id);

    if (updateError) {
      console.error("[PORTAL] Update new member's family_id error:", updateError);
      return NextResponse.json(
        { error: "Member added but failed to link their profile" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] family.member_add", {
      familyId,
      addedProfileId: profile_id,
      relationship,
      addedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error("[PORTAL] Family members POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/family/members
 *
 * Removes a member from the caller's family.
 * Body: { member_id: string }  (the family_members row id)
 * Only the family head can remove members.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { member_id } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        { error: "member_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify caller is family head
    const headCheck = await verifyFamilyHead(user.id, admin);
    if ("error" in headCheck) {
      return NextResponse.json(
        { error: headCheck.error },
        { status: headCheck.status }
      );
    }

    const { familyId } = headCheck;

    // Fetch the member record to confirm it belongs to this family
    const { data: memberRecord, error: fetchError } = await admin
      .from("family_members")
      .select("id, profile_id, relationship")
      .eq("id", member_id)
      .eq("family_id", familyId)
      .single();

    if (fetchError || !memberRecord) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Don't allow removing the head
    if (memberRecord.relationship === "head") {
      return NextResponse.json(
        { error: "Cannot remove the family head" },
        { status: 400 }
      );
    }

    // Remove the family_member record
    const { error: deleteError } = await admin
      .from("family_members")
      .delete()
      .eq("id", member_id);

    if (deleteError) {
      console.error("[PORTAL] Delete family member error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove family member" },
        { status: 500 }
      );
    }

    // Clear the removed profile's family_id
    const { error: updateError } = await admin
      .from("profiles")
      .update({ family_id: null, updated_at: new Date().toISOString() })
      .eq("id", memberRecord.profile_id);

    if (updateError) {
      console.error("[PORTAL] Clear removed member's family_id error:", updateError);
      // Member was already removed from the family_members table
    }

    console.log("[AUDIT] family.member_remove", {
      familyId,
      removedProfileId: memberRecord.profile_id,
      removedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PORTAL] Family members DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
