import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonies")
    .select("id, author_name, content, date, photo_url")
    .eq("is_approved", true)
    .order("date", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ testimonies: [] });
  return NextResponse.json({ testimonies: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { author_name, content } = body;
  if (!author_name || !content)
    return NextResponse.json({ error: "author_name and content are required" }, { status: 400 });

  const safeName = String(author_name).trim().slice(0, 200);
  const safeContent = String(content).trim().slice(0, 5000);
  if (!safeName || !safeContent)
    return NextResponse.json({ error: "author_name and content are required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("testimonies").insert({
    profile_id: user.id,
    author_name: safeName,
    content: safeContent,
    is_approved: false, // requires admin approval
    date: new Date().toISOString().split("T")[0],
  });

  if (error) return NextResponse.json({ error: "Failed to submit testimony" }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Your testimony has been submitted for review." }, { status: 201 });
}
