import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public-facing: returns published memorials only
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("memorials")
    .select("id, first_name, last_name, photo_url, date_of_birth, date_of_passing, obituary, scripture, scripture_text, favorite_hymn, church_roles, family_message")
    .eq("is_published", true)
    .is("archived_at", null)
    .order("date_of_passing", { ascending: false });

  if (error) return NextResponse.json({ memorials: [] });
  return NextResponse.json({ memorials: data ?? [] });
}
