import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

interface CsvRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  ward?: string;
  role?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row as unknown as CsvRow;
  }).filter((r) => r.first_name || r.last_name);
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { csv: string; preview?: boolean };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = parseCsv(body.csv ?? "");
  if (rows.length === 0) return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });

  // Preview mode: validate and return what would be imported
  if (body.preview) {
    const admin = createAdminClient();
    const emails = rows.map((r) => r.email).filter(Boolean);
    const { data: existing } = await admin.from("profiles").select("email").in("email", emails);
    const existingEmails = new Set((existing ?? []).map((e: { email: string }) => e.email));

    return NextResponse.json({
      preview: rows.map((r) => ({
        ...r,
        duplicate: r.email ? existingEmails.has(r.email) : false,
      })),
      total: rows.length,
      duplicates: rows.filter((r) => r.email && existingEmails.has(r.email)).length,
    });
  }

  // Commit: insert non-duplicate rows
  const admin = createAdminClient();
  const emails = rows.map((r) => r.email).filter(Boolean);
  const { data: existing } = await admin.from("profiles").select("email").in("email", emails);
  const existingEmails = new Set((existing ?? []).map((e: { email: string }) => e.email));

  const toInsert = rows
    .filter((r) => !r.email || !existingEmails.has(r.email))
    .map((r) => ({
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email || null,
      phone: r.phone || null,
      role: (r.role as string) || "member",
    }));

  if (toInsert.length === 0) return NextResponse.json({ ok: true, imported: 0, skipped: rows.length });

  const { error } = await admin.from("profiles").insert(toInsert);
  if (error) return NextResponse.json({ error: "Import failed: " + error.message }, { status: 500 });

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "member.create",
    userId: auth.user.id,
    resourceType: "members_import",
    metadata: { imported: toInsert.length, skipped: rows.length - toInsert.length },
    ip, userAgent,
  });

  return NextResponse.json({ ok: true, imported: toInsert.length, skipped: rows.length - toInsert.length });
}
