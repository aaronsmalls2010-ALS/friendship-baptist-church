import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeChildFields } from "@/lib/validations/children";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/portal/family/children/[id]
 *
 * Updates a child the caller owns (guardian_id === user.id).
 * Ownership is verified against the stored row before mutating — defense in
 * depth beyond RLS.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const admin = createAdminClient();

    // Verify ownership before mutating.
    const { data: existing } = await admin
      .from("children")
      .select("id, guardian_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.guardian_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = sanitizeChildFields(body as Record<string, unknown>);

    // If first_name is being changed, it must remain non-empty.
    if ("first_name" in updates && !updates.first_name) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: child, error } = await admin
      .from("children")
      .update(updates)
      .eq("id", id)
      .eq("guardian_id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("[PORTAL] Update child error:", error);
      return NextResponse.json(
        { error: "Failed to update child" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] child.update", {
      guardianId: user.id,
      childId: id,
      fields: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ child });
  } catch (err) {
    console.error("[PORTAL] Child PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/family/children/[id]
 *
 * Deletes a child the caller owns (guardian_id === user.id).
 * Ownership is verified against the stored row before deleting.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const admin = createAdminClient();

    // Verify ownership before deleting.
    const { data: existing } = await admin
      .from("children")
      .select("id, guardian_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.guardian_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await admin
      .from("children")
      .delete()
      .eq("id", id)
      .eq("guardian_id", user.id);

    if (error) {
      console.error("[PORTAL] Delete child error:", error);
      return NextResponse.json(
        { error: "Failed to remove child" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] child.delete", {
      guardianId: user.id,
      childId: id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PORTAL] Child DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
