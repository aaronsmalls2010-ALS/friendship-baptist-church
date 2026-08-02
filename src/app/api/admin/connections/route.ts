import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const CARD_TYPES = ["connect", "salvation", "baptism", "prayer", "interest"];
const STATUSES = ["new", "in_progress", "done"];

/**
 * GET /api/admin/connections
 *
 * Lists submitted connection cards, newest first. Optional ?status and ?type
 * filters. Requires admin-level role.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const admin = createAdminClient();
    let query = admin
      .from("connection_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && STATUSES.includes(status)) {
      query = query.eq("status", status);
    }
    if (type && CARD_TYPES.includes(type)) {
      query = query.eq("card_type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ADMIN] Fetch connection cards error:", error);
      return NextResponse.json(
        { error: "Failed to fetch connection cards" },
        { status: 500 }
      );
    }

    return NextResponse.json({ cards: data ?? [] });
  } catch (err) {
    console.error("[ADMIN] Connections GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
