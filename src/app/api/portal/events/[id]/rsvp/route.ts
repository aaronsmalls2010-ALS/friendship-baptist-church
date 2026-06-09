import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: eventId } = await params;
  const admin = createAdminClient();

  // Upsert RSVP (idempotent)
  const { error } = await admin.from("event_rsvps").upsert({
    event_id: eventId,
    profile_id: user.id,
    created_at: new Date().toISOString(),
  }, { onConflict: "event_id,profile_id" });

  if (error) return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: eventId } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to cancel RSVP" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ rsvped: false });

  const { id: eventId } = await params;
  const admin = createAdminClient();

  const { data } = await admin.from("event_rsvps")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();

  return NextResponse.json({ rsvped: !!data });
}
