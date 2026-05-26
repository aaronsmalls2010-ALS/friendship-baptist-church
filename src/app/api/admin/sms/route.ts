import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/sms
 *
 * Sends SMS messages via Twilio.
 * Body: { recipientGroup, message, schedule?, scheduleDate?, scheduleTime? }
 *
 * recipientGroup: "all" | "deacons" | "leaders" | "custom"
 * For "custom", also pass `customNumbers: string[]`
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check — must be admin
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check admin role
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Validate Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        {
          error:
            "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { recipientGroup, message, customNumbers } = body;

    if (!recipientGroup || !message) {
      return NextResponse.json(
        { error: "recipientGroup and message are required" },
        { status: 400 }
      );
    }

    if (message.length > 160) {
      return NextResponse.json(
        { error: "Message must be 160 characters or less" },
        { status: 400 }
      );
    }

    // Get recipient phone numbers based on group
    let phoneNumbers: string[] = [];

    if (recipientGroup === "custom" && customNumbers) {
      phoneNumbers = customNumbers;
    } else {
      let query = admin.from("profiles").select("phone, sms_opt_in");

      if (recipientGroup === "deacons") {
        query = query.in("role", ["deacon"]);
      } else if (recipientGroup === "leaders") {
        query = query.in("role", ["admin", "super_admin", "minister", "deacon"]);
      }
      // "all" = no filter, gets everyone

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) {
        console.error("[ADMIN] Fetch SMS recipients error:", profilesError);
        return NextResponse.json(
          { error: "Failed to fetch recipients" },
          { status: 500 }
        );
      }

      // Only send to members who have opted in to SMS and have a valid phone number
      phoneNumbers = (profiles || [])
        .filter((p: Record<string, unknown>) => p.sms_opt_in === true)
        .map((p: Record<string, unknown>) => p.phone as string)
        .filter((phone: string | null): phone is string => !!phone && phone.length >= 10);
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "No recipients with valid phone numbers found" },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);

    // Send messages
    const results = await Promise.allSettled(
      phoneNumbers.map((to) =>
        client.messages.create({
          body: message,
          from: fromNumber,
          to: formatPhoneNumber(to),
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Log the SMS send to the database (optional — create sms_log table if desired)
    try {
      await admin.from("sms_log").insert({
        sent_by: user.id,
        recipient_group: recipientGroup,
        message,
        recipients_count: phoneNumbers.length,
        sent_count: sent,
        failed_count: failed,
      });
    } catch {
      // sms_log table may not exist yet — that's OK
      console.log("[ADMIN] sms_log table not available, skipping log");
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: phoneNumbers.length,
    });
  } catch (err) {
    console.error("[ADMIN] SMS POST error:", err);
    return NextResponse.json(
      { error: "Failed to send messages" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sms
 *
 * Returns SMS send history from sms_log table.
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

    // Check admin role
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Fetch SMS history
    const { data: messages, error } = await admin
      .from("sms_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Table might not exist yet
      console.error("[ADMIN] Fetch SMS history error:", error);
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err) {
    console.error("[ADMIN] SMS GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Format a US phone number to E.164 format for Twilio */
function formatPhoneNumber(phone: string): string {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, "");

  // If it's 10 digits (US), prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it's 11 digits starting with 1 (US with country code)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Already has + prefix or international
  if (phone.startsWith("+")) {
    return phone;
  }

  // Default: prepend +1 for US
  return `+1${digits}`;
}
