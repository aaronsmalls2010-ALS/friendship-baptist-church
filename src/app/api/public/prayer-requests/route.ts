import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/prayer-requests
 *
 * Returns all public prayer requests, ordered by created_at descending.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: prayerRequests, error } = await admin
      .from("prayer_requests")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch prayer requests error:", error);
      return NextResponse.json(
        { error: "Failed to fetch prayer requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prayerRequests: prayerRequests ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Prayer requests GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/public/prayer-requests
 *
 * Creates a new prayer request (anonymous submission allowed).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, request: prayerRequest, is_public, category } = body;

    if (!name || !prayerRequest) {
      return NextResponse.json(
        { error: "Name and request are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prayer_requests")
      .insert({
        name,
        email: email || null,
        request: prayerRequest,
        is_public: is_public ?? false,
        category: category || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[PUBLIC] Create prayer request error:", error);
      return NextResponse.json(
        { error: "Failed to create prayer request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prayerRequest: data }, { status: 201 });
  } catch (err) {
    console.error("[PUBLIC] Prayer requests POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
