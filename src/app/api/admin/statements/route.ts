import { NextRequest, NextResponse } from "next/server";
import { requireFinance } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/org/get-organization";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface DonationRow {
  amount: number;
  date: string | null;
  created_at: string;
  donation_type: string | null;
  donation_types: { name: string } | null;
  profile_id: string | null;
  profiles: { first_name: string; last_name: string; email: string | null } | null;
}

interface DonorSummary {
  profile_id: string;
  name: string;
  email: string | null;
  total: number;
  count: number;
}

/**
 * GET /api/admin/statements?year=YYYY
 *
 * Finance-gated. Returns per-donor annual giving totals for the requested year,
 * grouped by profile_id, counting only non-archived gifts whose gift `date`
 * falls within the year. Anonymous gifts (no profile_id) are excluded because a
 * contribution statement requires a named donor.
 *
 * ?format=print renders a single printable HTML page with every donor's branded
 * statement (org name / EIN / address + tax disclaimer), one per page.
 */
export async function GET(request: NextRequest) {
  const auth = await requireFinance();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const format = searchParams.get("format") ?? "";
  const profileId = searchParams.get("profile_id") ?? "";

  if (isNaN(year) || year < 2000 || year > 2100)
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });

  const admin = createAdminClient();
  let dq = admin
    .from("donations")
    .select(`
      amount, date, created_at, donation_type, profile_id,
      donation_types(name),
      profiles(first_name, last_name, email)
    `)
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`)
    .is("archived_at", null)
    .not("profile_id", "is", null)
    .order("date");

  // A single-donor statement (admin "View statement") narrows to one profile.
  if (profileId) dq = dq.eq("profile_id", profileId);

  const { data, error } = await dq;

  if (error) return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });

  const rows = (data ?? []) as unknown as DonationRow[];

  // Group per donor
  const byDonor = new Map<string, DonorSummary>();
  for (const d of rows) {
    if (!d.profile_id) continue;
    const p = d.profiles;
    const name = p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown Donor";
    const existing = byDonor.get(d.profile_id);
    if (existing) {
      existing.total += Number(d.amount);
      existing.count += 1;
    } else {
      byDonor.set(d.profile_id, {
        profile_id: d.profile_id,
        name,
        email: p?.email ?? null,
        total: Number(d.amount),
        count: 1,
      });
    }
  }

  const donors = Array.from(byDonor.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // JSON summary for the admin table
  if (format !== "print") {
    return NextResponse.json({
      year,
      donors,
      donorCount: donors.length,
      grandTotal: donors.reduce((s, d) => s + d.total, 0),
    });
  }

  // Printable "all statements" HTML
  const org = await getOrganization();

  // Build per-donor line items
  const lineItemsByDonor = new Map<string, DonationRow[]>();
  for (const d of rows) {
    if (!d.profile_id) continue;
    const list = lineItemsByDonor.get(d.profile_id) ?? [];
    list.push(d);
    lineItemsByDonor.set(d.profile_id, list);
  }

  const orgAddr = `${esc(org.address_street)}, ${esc(org.address_city)}, ${esc(org.address_state)} ${esc(org.address_zip)}`;
  const orgContact = `${esc(org.phone)} · ${esc(org.email)}${org.ein ? ` · EIN: ${esc(org.ein)}` : ""}`;

  const statements = donors
    .map((donor) => {
      const items = (lineItemsByDonor.get(donor.profile_id) ?? []).map((d) => {
        const t = d.donation_types;
        const giftDate = (d.date ?? d.created_at?.split("T")[0]) ?? "";
        return `<tr>
          <td>${esc(String(giftDate))}</td>
          <td>${esc(t?.name ?? d.donation_type ?? "")}</td>
          <td>$${Number(d.amount).toFixed(2)}</td>
        </tr>`;
      }).join("");

      return `<section class="statement">
  <h1>${esc(org.church_name)}</h1>
  <div class="org">${orgAddr}<br>${orgContact}</div>
  <div class="member">
    <strong>${esc(donor.name)}</strong>${donor.email ? `<br>${esc(donor.email)}` : ""}
  </div>
  <h2>${year} Contribution Statement</h2>
  <table>
    <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
    <tbody>${items || '<tr><td colspan="3" style="color:#999;font-style:italic;">No contributions recorded for this year</td></tr>'}</tbody>
  </table>
  <p class="total">Total ${year} Contributions: $${donor.total.toFixed(2)}</p>
  <p class="disclaimer">No goods or services were provided in exchange for these contributions. This statement was prepared for tax purposes.</p>
</section>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${year} Contribution Statements</title>
<style>
  body { font-family: Georgia, serif; color: #111; margin: 0; }
  .toolbar { text-align: right; padding: 16px 40px; }
  .toolbar button { padding: 6px 14px; background: #6b21a8; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
  .statement { max-width: 700px; margin: 0 auto; padding: 40px; page-break-after: always; }
  .statement:last-of-type { page-break-after: auto; }
  h1 { font-size: 1.4rem; margin-bottom: 4px; }
  h2 { font-size: 1.1rem; }
  .org { font-size: 0.9rem; color: #555; margin-bottom: 24px; }
  .member { margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #f5f5f5; border-bottom: 2px solid #ccc; padding: 8px; text-align: left; font-size: 0.85rem; }
  td { border-bottom: 1px solid #eee; padding: 8px; font-size: 0.9rem; }
  .total { font-weight: bold; font-size: 1.1rem; margin-top: 16px; }
  .disclaimer { margin-top: 24px; font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
  .empty { max-width: 700px; margin: 40px auto; color: #999; font-style: italic; text-align: center; }
  @media print { .toolbar { display: none; } }
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save PDF</button></div>
${statements || '<p class="empty">No contributions recorded for ' + year + '.</p>'}
</body>
</html>`;

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "export.pdf",
    userId: auth.user.id,
    resourceType: "statements",
    metadata: { year, donors: donors.length, single: profileId || undefined },
    ip,
    userAgent,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="statements-${year}.html"`,
    },
  });
}
