import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { data: profile } = await admin
      .from("profiles")
      .select("ward_id")
      .eq("id", user.id)
      .single();

    if (!profile?.ward_id) {
      return NextResponse.json({ ward: null, deacons: [], members: [] });
    }

    const { data: ward } = await admin
      .from("wards")
      .select("id, name, description")
      .eq("id", profile.ward_id)
      .single();

    if (!ward) {
      return NextResponse.json({ ward: null, deacons: [], members: [] });
    }

    // Canonical model: a ward's deacon(s) are every ACTIVE deacon whose
    // deacons.ward_id matches this ward (there can be multiple). Derive from
    // that field — wards.deacon_id is no longer used. Email/photo fall back to
    // the linked member profile when the deacon record has no standalone value.
    const { data: rawDeacons } = await admin
      .from("deacons")
      .select("id, first_name, last_name, phone, title, profiles(first_name, last_name, phone, email, photo_url)")
      .eq("ward_id", profile.ward_id)
      .eq("is_active", true)
      .order("last_name");

    const deacons = (rawDeacons ?? []).map((d: Record<string, unknown>) => {
      const p = d.profiles as Record<string, unknown> | null;
      return {
        id: d.id,
        first_name: (d.first_name as string) || (p?.first_name as string) || "",
        last_name: (d.last_name as string) || (p?.last_name as string) || "",
        title: (d.title as string) || null,
        phone: (d.phone as string) || (p?.phone as string) || null,
        email: (p?.email as string) || null,
        photo_url: (p?.photo_url as string) || null,
      };
    });

    const { data: members } = await admin
      .from("profiles")
      .select("id, first_name, last_name, phone, email, photo_url")
      .eq("ward_id", profile.ward_id)
      .neq("id", user.id)
      .order("last_name");

    return NextResponse.json({
      ward: { id: ward.id, name: ward.name, description: ward.description },
      deacons,
      members: members ?? [],
    });
  } catch (err) {
    console.error("[PORTAL] Ward GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
