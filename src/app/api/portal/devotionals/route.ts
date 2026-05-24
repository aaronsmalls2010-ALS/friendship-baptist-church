import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/portal/devotionals
 *
 * Returns devotionals with two modes:
 * - daily: 2 deterministically random devotionals for today (default)
 * - all: all devotionals ordered by date desc
 *
 * Query params:
 *   ?mode=daily (default) | all
 *   ?category=spiritual_growth|emotional_encouragement|faith|love|worship (optional filter)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "daily";
    const category = searchParams.get("category");

    const admin = createAdminClient();

    if (mode === "daily") {
      // Fetch all devotionals to pick 2 deterministically based on today's date
      let query = admin.from("devotionals").select("*");
      if (category) {
        query = query.eq("category", category);
      }
      const { data: allDevotionals, error } = await query.order("id");

      if (error) {
        console.error("[PORTAL] Fetch devotionals error:", error);
        return NextResponse.json(
          { error: "Failed to fetch devotionals" },
          { status: 500 }
        );
      }

      const devotionals = allDevotionals || [];

      if (devotionals.length === 0) {
        return NextResponse.json({ daily: [], devotionals: [] });
      }

      // Use today's date to deterministically pick 2 devotionals
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 0);
      const dayOfYear = Math.floor(
        (today.getTime() - startOfYear.getTime()) / 86400000
      );

      // Pick 2 from different categories if possible
      const idx1 = dayOfYear % devotionals.length;
      let idx2 = (dayOfYear * 7 + 13) % devotionals.length;
      if (idx2 === idx1) {
        idx2 = (idx2 + 1) % devotionals.length;
      }

      // Ensure different categories if possible
      const pick1 = devotionals[idx1];
      let pick2 = devotionals[idx2];
      if (
        pick1.category === pick2.category &&
        devotionals.length > 2
      ) {
        // Try to find one from a different category
        for (let i = 0; i < devotionals.length; i++) {
          const candidate = devotionals[(idx2 + i) % devotionals.length];
          if (
            candidate.category !== pick1.category &&
            candidate.id !== pick1.id
          ) {
            pick2 = candidate;
            break;
          }
        }
      }

      const daily = [pick1, pick2];

      return NextResponse.json({ daily, devotionals });
    }

    // Mode: all — return all devotionals with optional category filter
    let query = admin.from("devotionals").select("*");
    if (category) {
      query = query.eq("category", category);
    }
    const { data: devotionals, error } = await query.order("date", {
      ascending: false,
    });

    if (error) {
      console.error("[PORTAL] Fetch devotionals error:", error);
      return NextResponse.json(
        { error: "Failed to fetch devotionals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ devotionals: devotionals || [] });
  } catch (err) {
    console.error("[PORTAL] Devotionals GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
