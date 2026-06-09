import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ birthdays: [] });

  // Get birthdays within the next 7 days (by month/day, ignoring year)
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, photo_url, birthday")
    .not("birthday", "is", null);

  if (!profiles) return NextResponse.json({ birthdays: [] });

  const now = new Date();
  const upcoming = profiles
    .filter((p: { birthday: string }) => {
      if (!p.birthday) return false;
      const bday = new Date(p.birthday);
      const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      const diff = thisYear.getTime() - now.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    })
    .sort((a: { birthday: string }, b: { birthday: string }) => {
      const da = new Date(a.birthday), db = new Date(b.birthday);
      const fa = new Date(now.getFullYear(), da.getMonth(), da.getDate());
      const fb = new Date(now.getFullYear(), db.getMonth(), db.getDate());
      return fa.getTime() - fb.getTime();
    });

  return NextResponse.json({ birthdays: upcoming });
}
