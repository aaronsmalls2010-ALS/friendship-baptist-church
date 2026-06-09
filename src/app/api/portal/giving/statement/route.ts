import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/org/get-organization";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const admin = createAdminClient();
  const [{ data: profile }, { data: donations }, org] = await Promise.all([
    admin.from("profiles").select("first_name, last_name, email").eq("id", user.id).single(),
    admin.from("donations")
      .select("amount, donation_type, created_at, donation_types(name)")
      .eq("profile_id", user.id)
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31T23:59:59`)
      .is("archived_at", null)
      .order("created_at"),
    getOrganization(),
  ]);

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const total = (donations ?? []).reduce((s: number, d: { amount: number }) => s + d.amount, 0);

  const rows = (donations ?? []).map((d: { created_at: string; donation_types: unknown; donation_type: string; amount: number }) => {
    const t = d.donation_types as { name: string } | null;
    return `<tr>
      <td>${String(d.created_at).split("T")[0]}</td>
      <td>${t?.name ?? d.donation_type ?? ""}</td>
      <td>$${Number(d.amount).toFixed(2)}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${year} Contribution Statement</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #111; }
  h1 { font-size: 1.4rem; margin-bottom: 4px; }
  .org { font-size: 0.9rem; color: #555; margin-bottom: 24px; }
  .member { margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #f5f5f5; border-bottom: 2px solid #ccc; padding: 8px; text-align: left; font-size: 0.85rem; }
  td { border-bottom: 1px solid #eee; padding: 8px; font-size: 0.9rem; }
  .total { font-weight: bold; font-size: 1.1rem; margin-top: 16px; }
  .disclaimer { margin-top: 24px; font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
  @media print { button { display: none; } }
</style>
</head>
<body>
<button onclick="window.print()" style="float:right;padding:6px 14px;background:#6b21a8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.85rem;">Print / Save PDF</button>
<h1>${org.church_name}</h1>
<div class="org">
  ${org.address_street}, ${org.address_city}, ${org.address_state} ${org.address_zip}<br>
  ${org.phone} · ${org.email}${org.ein ? ` · EIN: ${org.ein}` : ""}
</div>
<div class="member">
  <strong>${profile.first_name} ${profile.last_name}</strong><br>
  ${profile.email}
</div>
<h2 style="font-size:1.1rem;">${year} Contribution Statement</h2>
<table>
  <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="3" style="color:#999;font-style:italic;">No contributions recorded for this year</td></tr>'}</tbody>
</table>
<p class="total">Total ${year} Contributions: $${total.toFixed(2)}</p>
<p class="disclaimer">No goods or services were provided in exchange for these contributions. This statement was prepared for tax purposes.</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="giving-statement-${year}.html"`,
    },
  });
}
