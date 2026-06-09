import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin.from("sms_templates").select("*").order("name");
  if (error) return NextResponse.json({ templates: [] });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, body: tmplBody } = body;
  if (!name || !tmplBody) return NextResponse.json({ error: "name and body required" }, { status: 400 });
  if (String(tmplBody).length > 160) return NextResponse.json({ error: "Body must be ≤160 chars" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("sms_templates").insert({
    name: String(name).trim(),
    body: String(tmplBody).trim(),
    created_by: auth.user.id,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("sms_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
