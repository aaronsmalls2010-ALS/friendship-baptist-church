import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/phone";

async function getRecipientPhones(
  admin: ReturnType<typeof createAdminClient>,
  recipientGroup: string,
  customNumbers?: string[]
): Promise<string[]> {
  if (recipientGroup === "custom" && customNumbers) return customNumbers;

  let query = admin.from("profiles").select("phone, sms_opt_in");
  if (recipientGroup === "deacons") query = query.in("role", ["deacon"]);
  else if (recipientGroup === "leaders") query = query.in("role", ["admin", "super_admin", "minister", "deacon", "pastor"]);

  const { data: profiles, error } = await query;
  if (error || !profiles) return [];

  return profiles
    .filter((p: Record<string, unknown>) => p.sms_opt_in === true)
    .map((p: Record<string, unknown>) => p.phone as string)
    .filter((phone: string | null): phone is string => !!phone && phone.length >= 10);
}

async function getTotalCount(
  admin: ReturnType<typeof createAdminClient>,
  recipientGroup: string
): Promise<{ total: number; opted_in: number }> {
  let query = admin.from("profiles").select("sms_opt_in");
  if (recipientGroup === "deacons") query = query.in("role", ["deacon"]);
  else if (recipientGroup === "leaders") query = query.in("role", ["admin", "super_admin", "minister", "deacon", "pastor"]);

  const { data } = await query;
  if (!data) return { total: 0, opted_in: 0 };
  return {
    total: data.length,
    opted_in: data.filter((p: Record<string, unknown>) => p.sms_opt_in === true).length,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);

  // ?count=true&group=X — return opt-in count for the given group
  if (searchParams.get("count") === "true") {
    const group = searchParams.get("group") ?? "all";
    const counts = await getTotalCount(admin, group);
    return NextResponse.json(counts);
  }

  const { data: messages, error } = await admin
    .from("sms_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ messages: [] });
  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { recipientGroup, message, customNumbers } = body;

  if (!recipientGroup || !message)
    return NextResponse.json({ error: "recipientGroup and message are required" }, { status: 400 });
  if (message.length > 160)
    return NextResponse.json({ error: "Message must be 160 characters or less" }, { status: 400 });

  const admin = createAdminClient();
  const phoneNumbers = await getRecipientPhones(admin, recipientGroup, customNumbers);

  if (phoneNumbers.length === 0)
    return NextResponse.json({ error: "No recipients with valid opted-in phone numbers found" }, { status: 400 });

  const twilio = await import("twilio");
  const client = twilio.default(accountSid, authToken);

  const results = await Promise.allSettled(
    phoneNumbers.map((to) =>
      client.messages.create({ body: message, from: fromNumber, to: toE164(to) ?? to })
    )
  );

  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  try {
    await admin.from("sms_log").insert({
      sent_by: auth.user.id,
      recipient_group: recipientGroup,
      message,
      recipients_count: phoneNumbers.length,
      sent_count: sent,
      failed_count: failed,
    });
  } catch {
    // sms_log table may not exist — non-fatal
  }

  return NextResponse.json({ success: true, sent, failed, total: phoneNumbers.length });
}
