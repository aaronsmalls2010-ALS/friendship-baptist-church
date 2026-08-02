import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

export async function GET(request: NextRequest) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const donorName   = searchParams.get("donor") ?? "";
  const dateFrom    = searchParams.get("from") ?? "";
  const dateTo      = searchParams.get("to") ?? "";
  const typeSlug    = searchParams.get("type") ?? "";
  const recurring   = searchParams.get("recurring") ?? "";
  const showArchived = searchParams.get("archived") === "true";

  const admin = createAdminClient();
  let query = admin
    .from("donations")
    .select(`
      id, amount, donation_type, campaign, date, created_at, is_recurring,
      profile_id, archived_at, donation_type_id,
      profiles(first_name, last_name),
      donation_types(name, slug)
    `)
    .order("date", { ascending: false });

  if (!showArchived) query = query.is("archived_at", null);
  if (dateFrom)      query = query.gte("date", dateFrom);
  if (dateTo)        query = query.lte("date", dateTo);
  if (recurring === "true")  query = query.eq("is_recurring", true);
  if (recurring === "false") query = query.eq("is_recurring", false);

  const { data: donations, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });

  let result = donations ?? [];

  // Client-side donor name filter (join field)
  if (donorName) {
    const q = donorName.toLowerCase();
    result = result.filter((d) => {
      const p = d.profiles as unknown as { first_name: string; last_name: string } | null;
      if (!p) return false;
      return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q);
    });
  }

  // Type filter by slug
  if (typeSlug) {
    result = result.filter((d) => {
      const t = d.donation_types as unknown as { slug: string } | null;
      return t?.slug === typeSlug || d.donation_type === typeSlug;
    });
  }

  return NextResponse.json({ donations: result });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { profile_id, amount, donation_type_id, campaign, date, method, check_number, note, is_recurring } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
  if (!donation_type_id)
    return NextResponse.json({ error: "Donation type is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("donations").insert({
    profile_id: profile_id ?? null,
    amount: Number(amount),
    donation_type_id,
    campaign: campaign ?? null,
    date: date ?? new Date().toISOString().split("T")[0],
    method: method ?? "cash",
    check_number: check_number ?? null,
    note: note ?? null,
    is_recurring: is_recurring ?? false,
    stripe_payment_id: null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Failed to record donation" }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "donation.create",
    userId: auth.user.id,
    resourceType: "donation",
    resourceId: data.id,
    metadata: { amount: Number(amount), method, campaign },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
