import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Fields the user is allowed to update on their own profile. */
const ALLOWED_FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "date_of_birth",
  "birthday",
  "gender",
  "about_bio",
  "emergency_contact_name",
  "emergency_contact_phone",
  "anniversary",
  "baptism_date",
  "marital_status",
  "occupation",
  "preferred_contact",
  // ward_id intentionally NOT member-editable — ward assignment is managed by
  // the church office (self-assigning exposed other wards' rosters).
  "photo_url",
  "email_notifications",
  "sms_opt_in",
  "public_directory",
] as const;

/**
 * Map incoming field names to their actual DB column names.
 * The DB has `birthday` (original schema) and `date_of_birth` (added later).
 * We accept both from the client and write to both columns for compatibility.
 */
const FIELD_ALIASES: Record<string, string[]> = {
  date_of_birth: ["date_of_birth", "birthday"],
  birthday: ["date_of_birth", "birthday"],
};

/**
 * GET /api/portal/profile
 *
 * Returns the authenticated user's own profile.
 */
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
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[PORTAL] Fetch profile error:", error.code, error.message, error.details, error.hint);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // Look up the ward name separately to avoid PostgREST join issues
    let wardName: string | null = null;
    if (profile?.ward_id) {
      const { data: ward } = await admin
        .from("wards")
        .select("name")
        .eq("id", profile.ward_id)
        .single();
      wardName = ward?.name ?? null;
    }

    return NextResponse.json({ profile: { ...profile, ward_name: wardName } });
  } catch (err) {
    console.error("[PORTAL] Profile GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portal/profile
 *
 * Updates the authenticated user's own profile.
 * Only the fields listed in ALLOWED_FIELDS can be changed.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Filter to only allowed fields, expanding aliases
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        const aliases = FIELD_ALIASES[key];
        if (aliases) {
          // Write to all alias columns so both birthday and date_of_birth stay in sync
          for (const alias of aliases) {
            updates[alias] = body[key];
          }
        } else {
          updates[key] = body[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const admin = createAdminClient();

    // Try the update; if a column doesn't exist, strip it and retry
    let result = await admin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    // If a column error occurs (e.g. birthday or date_of_birth missing),
    // remove the offending column and retry
    if (result.error && result.error.code === "42703") {
      const msg = result.error.message || "";
      // Extract column name from error message
      const colMatch = msg.match(/column "(\w+)"/);
      if (colMatch) {
        delete updates[colMatch[1]];
        result = await admin
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select("*")
          .single();
      }
    }

    const { data: profile, error } = result;

    if (error) {
      console.error("[PORTAL] Update profile error:", error);
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("[AUDIT] profile.update", {
      userId: user.id,
      fields: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    // Auto-create birthday event when birthday is set/updated
    if (updates.date_of_birth && profile) {
      try {
        const dob = new Date(updates.date_of_birth as string);
        const currentYear = new Date().getFullYear();
        const month = String(dob.getUTCMonth() + 1).padStart(2, "0");
        const day = String(dob.getUTCDate()).padStart(2, "0");
        const birthdayDate = `${currentYear}-${month}-${day}`;
        const firstName = profile.first_name || "Member";
        const lastName = profile.last_name || "";

        const { data: existing } = await admin
          .from("events")
          .select("id")
          .eq("profile_id", user.id)
          .eq("is_birthday", true)
          .maybeSingle();

        const eventData = {
          title: `Happy Birthday, ${firstName} ${lastName}!`,
          description: `Let's celebrate ${firstName}'s birthday! Send a birthday greeting to show the love of our church family.`,
          start_date: `${birthdayDate}T00:00:00`,
          end_date: `${birthdayDate}T23:59:59`,
          location: "Friendship Baptist Church",
          is_published: true,
          is_birthday: true,
          profile_id: user.id,
        };

        if (existing) {
          await admin.from("events").update(eventData).eq("id", existing.id);
        } else {
          await admin.from("events").insert(eventData);
        }
      } catch (bdayErr) {
        console.error("[PORTAL] Birthday event creation failed (non-fatal):", bdayErr);
      }
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[PORTAL] Profile PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
