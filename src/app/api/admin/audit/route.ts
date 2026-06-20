import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const userId   = searchParams.get("user_id") ?? "";
  const action   = searchParams.get("action") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo   = searchParams.get("to") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 50;

  const admin = createAdminClient();
  let query = admin
    .from("audit_log")
    .select("id, user_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (userId)   query = query.eq("user_id", userId);
  if (action)   query = query.ilike("action", `%${action}%`);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo)   query = query.lte("created_at", dateTo + "T23:59:59");

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });

  return NextResponse.json({ events: data ?? [], total: count ?? 0, page, pageSize });
}
