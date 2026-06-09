import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const ministryId = searchParams.get("ministry_id");
  const format = searchParams.get("format") ?? "json";

  const admin = createAdminClient();

  let query = admin
    .from("ministry_members")
    .select("profiles(first_name, last_name, email, phone), ministries(name)");

  if (ministryId) query = query.eq("ministry_id", ministryId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });

  const rows = (data ?? []).map((mm) => {
    const p = mm.profiles as unknown as { first_name: string; last_name: string; email: string; phone: string } | null;
    const m = mm.ministries as unknown as { name: string } | null;
    return {
      ministry: m?.name ?? "",
      first_name: p?.first_name ?? "",
      last_name: p?.last_name ?? "",
      email: p?.email ?? "",
      phone: p?.phone ?? "",
    };
  });

  if (format === "csv") {
    const csv = buildCsv(["ministry","first_name","last_name","email","phone"], rows);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="ministry-roster.csv"` },
    });
  }
  return NextResponse.json({ roster: rows });
}
