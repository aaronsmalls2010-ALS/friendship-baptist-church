import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";
import { buildCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo   = searchParams.get("to") ?? "";
  const typeSlug = searchParams.get("type") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("donations")
    .select(`
      id, amount, donation_type, campaign, date, created_at, is_recurring,
      profiles(first_name, last_name),
      donation_types(name)
    `)
    .is("archived_at", null)
    .order("date", { ascending: false });

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo)   query = query.lte("date", dateTo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });

  let rows = data ?? [];
  if (typeSlug) {
    rows = rows.filter((d) => {
      const t = d.donation_types as unknown as { name: string } | null;
      return t?.name?.toLowerCase().replace(/\s/g, "_") === typeSlug || d.donation_type === typeSlug;
    });
  }

  const headers = ["date", "donor", "amount", "type", "campaign", "recurring"];
  const csvRows = rows.map((d) => {
    const p = d.profiles as unknown as { first_name: string; last_name: string } | null;
    const t = d.donation_types as unknown as { name: string } | null;
    return {
      date: (d.date as string | null) ?? d.created_at?.split("T")[0] ?? "",
      donor: p ? `${p.first_name} ${p.last_name}` : "Anonymous",
      amount: d.amount,
      type: t?.name ?? d.donation_type ?? "",
      campaign: d.campaign ?? "",
      recurring: d.is_recurring ? "Yes" : "No",
    };
  });

  const csv = buildCsv(headers, csvRows);

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "export.csv",
    userId: auth.user.id,
    resourceType: "donations",
    metadata: { rows: csvRows.length, filters: { dateFrom, dateTo, typeSlug } },
    ip,
    userAgent,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="donations-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
