import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeChildFields } from "@/lib/validations/children";

/**
 * GET /api/portal/family/children
 *
 * Returns the authenticated user's children (guardian_id = user.id),
 * ordered by birthdate.
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
    const { data: children, error } = await admin
      .from("children")
      .select("*")
      .eq("guardian_id", user.id)
      .order("birthdate", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[PORTAL] Fetch children error:", error);
      return NextResponse.json(
        { error: "Failed to fetch children" },
        { status: 500 }
      );
    }

    return NextResponse.json({ children: children ?? [] });
  } catch (err) {
    console.error("[PORTAL] Children GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/family/children
 *
 * Creates a child for the authenticated caller.
 * Body: { first_name (required), last_name, birthdate, grade, allergies, notes }
 * - guardian_id is forced to the caller's id.
 * - family_id is set to the caller's family only if they belong to exactly one.
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

    const body = await request.json().catch(() => ({}));
    const fields = sanitizeChildFields(body as Record<string, unknown>);

    // first_name is required and must be non-empty after trimming.
    if (!fields.first_name) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Resolve the caller's family: only auto-assign if they belong to exactly one.
    let familyId: string | null = null;
    const { data: memberships } = await admin
      .from("family_members")
      .select("family_id")
      .eq("profile_id", user.id);
    const familyIds = Array.from(
      new Set((memberships ?? []).map((m) => m.family_id))
    );
    if (familyIds.length === 1) {
      familyId = familyIds[0];
    }

    const insertData = {
      ...fields,
      guardian_id: user.id,
      family_id: familyId,
    };

    const { data: child, error } = await admin
      .from("children")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      console.error("[PORTAL] Create child error:", error);
      return NextResponse.json(
        { error: "Failed to add child" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] child.create", {
      guardianId: user.id,
      childId: child.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ child });
  } catch (err) {
    console.error("[PORTAL] Children POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
