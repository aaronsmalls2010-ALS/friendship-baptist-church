import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: memorials, error } = await admin
      .from("memorials")
      .select("*, memorial_photos(*), memorial_comments(*)")
      .eq("is_published", true)
      .is("archived_at", null)
      .order("date_of_passing", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch memorials error:", error);
      return NextResponse.json(
        { error: "Failed to fetch memorials" },
        { status: 500 }
      );
    }

    const safe = (memorials ?? []).map((m) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      photo_url: m.photo_url,
      date_of_birth: m.date_of_birth,
      date_of_passing: m.date_of_passing,
      obituary: m.obituary,
      scripture: m.scripture,
      scripture_text: m.scripture_text,
      favorite_hymn: m.favorite_hymn,
      church_roles: m.church_roles,
      family_message: m.family_message,
      is_published: m.is_published,
      photos: m.memorial_photos ?? [],
      comments: (m.memorial_comments ?? []).map((c: Record<string, unknown>) => ({
        id: c.id,
        memorial_id: c.memorial_id,
        author_name: c.author_name,
        body: c.body,
        created_at: c.created_at,
      })),
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));

    return NextResponse.json({ memorials: safe });
  } catch (err) {
    console.error("[PUBLIC] Memorials GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
