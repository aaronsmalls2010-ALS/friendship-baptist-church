import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/ministries
 *
 * Returns all active ministries, ordered by name.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: ministries, error } = await admin
      .from("ministries")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[PUBLIC] Fetch ministries error:", error);
      return NextResponse.json(
        { error: "Failed to fetch ministries" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ministries: ministries ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Ministries GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
