import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
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

/** Parse one CSV line respecting double-quoted fields (which may contain commas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );
  return lines
    .slice(1)
    .map((line) => {
      const vals = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row as unknown as CsvRow;
    })
    .filter((r) => r.first_name || r.last_name);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { csv: string; preview?: boolean };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = parseCsv(body.csv ?? "");
  if (rows.length === 0) return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });

  const admin = createAdminClient();
  const emails = rows.map((r) => (r.email || "").toLowerCase()).filter(Boolean);
  const { data: existing } = await admin
    .from("profiles")
    .select("email")
    .in("email", emails.length ? emails : ["__none__"]);
  const existingEmails = new Set(
    (existing ?? []).map((e: { email: string }) => (e.email || "").toLowerCase())
  );

  // Preview mode: validate and return what would be imported
  if (body.preview) {
    return NextResponse.json({
      preview: rows.map((r) => ({
        ...r,
        duplicate: r.email ? existingEmails.has(r.email.toLowerCase()) : false,
      })),
      total: rows.length,
      duplicates: rows.filter((r) => r.email && existingEmails.has(r.email.toLowerCase())).length,
    });
  }

  // Map ward names -> ids so the CSV `ward` column is actually saved.
  const { data: wards } = await admin.from("wards").select("id, name");
  const wardByName = new Map(
    (wards ?? []).map((w: { id: string; name: string }) => [w.name.trim().toLowerCase(), w.id])
  );

  const toProcess = rows.filter((r) => !r.email || !existingEmails.has(r.email.toLowerCase()));

  let imported = 0;
  const failed: { name: string; reason: string }[] = [];

  for (const r of toProcess) {
    const wardId = r.ward ? wardByName.get(r.ward.trim().toLowerCase()) ?? null : null;

    if (r.email) {
      // Provision an auth user so the member can sign in (via password reset).
      // The handle_new_user trigger creates the linked profile automatically.
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: r.email,
        phone: r.phone || undefined,
        email_confirm: true,
        user_metadata: { first_name: r.first_name, last_name: r.last_name },
      });
      if (cErr || !created?.user) {
        failed.push({ name: `${r.first_name} ${r.last_name}`, reason: cErr?.message ?? "createUser failed" });
        continue;
      }
      // Backfill fields the trigger doesn't set; imported members are pre-approved.
      await admin
        .from("profiles")
        .update({ ward_id: wardId, is_approved: true })
        .eq("id", created.user.id);
      imported++;
    } else {
      // No email — a directory-only contact record (cannot log in until an email
      // is added and they register / reset).
      const { error } = await admin.from("profiles").insert({
        first_name: r.first_name,
        last_name: r.last_name,
        phone: r.phone || null,
        role: "member",
        ward_id: wardId,
        is_approved: true,
      });
      if (error) failed.push({ name: `${r.first_name} ${r.last_name}`, reason: error.message });
      else imported++;
    }
  }

  const skipped = rows.length - toProcess.length;
  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "member.create",
    userId: auth.user.id,
    resourceType: "members_import",
    metadata: { imported, skipped, failed: failed.length },
    ip, userAgent,
  });

  return NextResponse.json({ ok: true, imported, skipped, failed });
}
