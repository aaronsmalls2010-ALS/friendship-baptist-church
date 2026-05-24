import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/wards
 *
 * Returns all wards, ordered by name.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: wards, error } = await admin
      .from("wards")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[PUBLIC] Fetch wards error:", error);
      return NextResponse.json(
        { error: "Failed to fetch wards" },
        { status: 500 }
      );
    }

    return NextResponse.json({ wards: wards ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Wards GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
