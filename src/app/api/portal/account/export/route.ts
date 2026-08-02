import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/account/export
 *
 * Returns the caller's OWN data as a downloadable JSON file: their profile,
 * their donations, and their event RSVPs. Every query is scoped to
 * `user.id`, so a caller can only ever export their own account.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    const [profileRes, donationsRes, rsvpRes] = await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin
        .from("donations")
        .select("*")
        .eq("profile_id", user.id)
        .order("date", { ascending: false }),
      admin
        .from("event_rsvps")
        .select("event_id, created_at, events(title, start_date, location)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const exportPayload = {
      export_generated_at: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email ?? null,
      },
      profile: profileRes.data ?? null,
      donations: donationsRes.data ?? [],
      event_rsvps: rsvpRes.data ?? [],
    };

    const filename = `friendship-baptist-my-data-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[PORTAL] Account export error:", err);
    return NextResponse.json(
      { error: "Failed to export your data" },
      { status: 500 }
    );
  }
}
