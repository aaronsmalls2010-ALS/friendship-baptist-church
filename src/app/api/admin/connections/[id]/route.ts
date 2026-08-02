import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = ["new", "in_progress", "done"];

/**
 * PATCH /api/admin/connections/[id]
 *
 * Updates a connection card's status. Requires admin-level role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { status } = body;
    if (typeof status !== "string" || !STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing, error: fetchError } = await admin
      .from("connection_cards")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Connection card not found" },
        { status: 404 }
      );
    }

    const { data: card, error } = await admin
      .from("connection_cards")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update connection card error:", error);
      return NextResponse.json(
        { error: "Failed to update connection card" },
        { status: 500 }
      );
    }

    return NextResponse.json({ card });
  } catch (err) {
    console.error("[ADMIN] Connections PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/connections/[id]
 *
 * Deletes a connection card. Requires admin-level role.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing, error: fetchError } = await admin
      .from("connection_cards")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Connection card not found" },
        { status: 404 }
      );
    }

    const { error } = await admin.from("connection_cards").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete connection card error:", error);
      return NextResponse.json(
        { error: "Failed to delete connection card" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Connections DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
