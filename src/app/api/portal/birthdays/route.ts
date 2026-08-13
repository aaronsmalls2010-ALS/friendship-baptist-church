import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ birthdays: [] });

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, photo_url, date_of_birth, birthday")
    .or("date_of_birth.not.is.null,birthday.not.is.null");

  if (!profiles) return NextResponse.json({ birthdays: [] });

  const now = new Date();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const upcoming = profiles
    .map((p: Record<string, string | null>) => ({
      ...p,
      date_of_birth: p.date_of_birth || p.birthday || null,
    }))
    .filter((p: { date_of_birth: string | null }) => {
      if (!p.date_of_birth) return false;
      // Parse as LOCAL noon — new Date("YYYY-MM-DD") is UTC midnight, which lands
      // on the previous day in US time zones (birthdays off by one).
      const dob = new Date(p.date_of_birth + "T12:00:00");
      const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      const diff = thisYear.getTime() - now.getTime();
      return diff >= 0 && diff <= sevenDays;
    })
    .sort((a, b) => {
      const da = new Date(a.date_of_birth! + "T12:00:00"), db = new Date(b.date_of_birth! + "T12:00:00");
      const fa = new Date(now.getFullYear(), da.getMonth(), da.getDate());
      const fb = new Date(now.getFullYear(), db.getMonth(), db.getDate());
      return fa.getTime() - fb.getTime();
    });

  return NextResponse.json({ birthdays: upcoming });
}
