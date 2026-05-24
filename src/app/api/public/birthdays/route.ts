import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/birthdays
 *
 * Returns profiles that have a birthday (date_of_birth) set.
 * Only returns id, first_name, last_name, and date_of_birth.
 * Used by the calendar and events pages to show member birthdays.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, first_name, last_name, date_of_birth, birthday")
      .or("date_of_birth.not.is.null,birthday.not.is.null");

    if (error) {
      console.error("[PUBLIC] Fetch birthdays error:", error);
      return NextResponse.json(
        { error: "Failed to fetch birthdays" },
        { status: 500 }
      );
    }

    // Normalize: use date_of_birth or birthday field, whichever exists
    const birthdays = (profiles || [])
      .map((p: Record<string, string | null>) => ({
        id: p.id,
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        date_of_birth: p.date_of_birth || p.birthday || null,
      }))
      .filter((p: { date_of_birth: string | null }) => p.date_of_birth !== null);

    return NextResponse.json({ birthdays });
  } catch (err) {
    console.error("[PUBLIC] Birthdays GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
