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
      return NextResponse.json({ ward: null, deacon: null, members: [] });
    }

    const { data: ward } = await admin
      .from("wards")
      .select("id, name, description, deacon_id")
      .eq("id", profile.ward_id)
      .single();

    if (!ward) {
      return NextResponse.json({ ward: null, deacon: null, members: [] });
    }

    let deacon = null;
    if (ward.deacon_id) {
      const { data: deaconProfile } = await admin
        .from("profiles")
        .select("id, first_name, last_name, phone, email, photo_url")
        .eq("id", ward.deacon_id)
        .single();
      deacon = deaconProfile;
    }

    const { data: members } = await admin
      .from("profiles")
      .select("id, first_name, last_name, phone, email, photo_url")
      .eq("ward_id", profile.ward_id)
      .neq("id", user.id)
      .order("last_name");

    return NextResponse.json({
      ward: { id: ward.id, name: ward.name, description: ward.description },
      deacon,
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
