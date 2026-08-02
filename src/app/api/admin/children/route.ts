import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/children
 *
 * Lists every child on file with their guardian's display name, for the
 * attendance check-in picker. Sorted by last then first name.
 * Requires admin or super_admin role.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();

  const { data: children, error } = await admin
    .from("children")
    .select("id, first_name, last_name, grade, allergies, guardian_id")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    console.error("[ADMIN] Fetch children error:", error);
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 });
  }

  const list = children ?? [];

  // Resolve guardian display names in one bulk query.
  const guardianIds = Array.from(
    new Set(list.map((c) => c.guardian_id).filter((v): v is string => !!v))
  );
  const guardianMap = new Map<string, string>();
  if (guardianIds.length > 0) {
    const { data: guardians } = await admin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", guardianIds);
    for (const g of guardians ?? []) {
      guardianMap.set(g.id, `${g.first_name ?? ""} ${g.last_name ?? ""}`.trim());
    }
  }

  const result = list.map((c) => ({
    id: c.id,
    first_name: c.first_name ?? "",
    last_name: c.last_name ?? "",
    grade: c.grade ?? null,
    allergies: c.allergies ?? null,
    guardian_name: c.guardian_id ? guardianMap.get(c.guardian_id) ?? null : null,
  }));

  return NextResponse.json({ children: result });
}
