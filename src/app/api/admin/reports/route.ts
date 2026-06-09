import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "members";
  const format = searchParams.get("format") ?? "json";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  if (type === "members") {
    const { data } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email, phone, role, status, created_at, ward_id")
      .is("archived_at", null)
      .order("last_name");

    if (format === "csv") {
      const headers = ["first_name","last_name","email","phone","role","status","created_at"];
      const csv = buildCsv(headers, (data ?? []) as Parameters<typeof buildCsv>[1]);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="members-report.csv"` },
      });
    }
    return NextResponse.json({ members: data ?? [] });
  }

  if (type === "ministries") {
    const { data } = await admin
      .from("ministries")
      .select("id, name, description, ministry_members(count)")
      .order("name");

    return NextResponse.json({ ministries: data ?? [] });
  }

  if (type === "wards") {
    const { data } = await admin
      .from("wards")
      .select("id, name, profiles(id, first_name, last_name, role)")
      .order("name");

    return NextResponse.json({ wards: data ?? [] });
  }

  if (type === "giving") {
    // Finance-gated
    const finAuth = await requireFinance();
    if (!finAuth.ok) return NextResponse.json({ error: finAuth.error }, { status: finAuth.status });

    let query = admin
      .from("donations")
      .select("id, amount, donation_type, campaign, created_at, is_recurring, profiles(first_name, last_name), donation_types(name)")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data } = await query;

    if (format === "csv") {
      const headers = ["date","donor","amount","type","campaign","recurring"];
      const rows = (data ?? []).map((d) => {
        const p = d.profiles as unknown as { first_name: string; last_name: string } | null;
        const t = d.donation_types as unknown as { name: string } | null;
        return {
          date: String(d.created_at).split("T")[0],
          donor: p ? `${p.first_name} ${p.last_name}` : "Anonymous",
          amount: d.amount,
          type: t?.name ?? d.donation_type ?? "",
          campaign: d.campaign ?? "",
          recurring: d.is_recurring ? "Yes" : "No",
        };
      });
      const csv = buildCsv(headers, rows);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="giving-report.csv"` },
      });
    }
    return NextResponse.json({ donations: data ?? [] });
  }

  if (type === "lapsed") {
    // Finance-gated: gave in prior 12mo but nothing in last 90 days
    const finAuth = await requireFinance();
    if (!finAuth.ok) return NextResponse.json({ error: finAuth.error }, { status: finAuth.status });

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const oneYearAgo    = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

    // Members who gave in the past year
    const { data: recentGivers } = await admin
      .from("donations")
      .select("profile_id")
      .gte("created_at", oneYearAgo)
      .is("archived_at", null);

    const allGiverIds = [...new Set((recentGivers ?? []).map((d: { profile_id: string }) => d.profile_id).filter(Boolean))];

    // Members who also gave in the last 90 days
    const { data: activeGivers } = await admin
      .from("donations")
      .select("profile_id")
      .gte("created_at", ninetyDaysAgo)
      .is("archived_at", null);

    const activeIds = new Set((activeGivers ?? []).map((d: { profile_id: string }) => d.profile_id));
    const lapsedIds = allGiverIds.filter((id) => !activeIds.has(id));

    if (lapsedIds.length === 0) return NextResponse.json({ lapsed: [] });

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .in("id", lapsedIds);

    if (format === "csv") {
      const headers = ["first_name","last_name","email","phone"];
      const csv = buildCsv(headers, (profiles ?? []) as Parameters<typeof buildCsv>[1]);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="lapsed-givers.csv"` },
      });
    }
    return NextResponse.json({ lapsed: profiles ?? [] });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
