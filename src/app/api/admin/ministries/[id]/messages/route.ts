import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/ministries/[id]/messages
 *
 * Returns all messages for this ministry.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ministryId } = await params;

    const authCtx = await getAuthContext();
    if (!authCtx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = authCtx.user;
    const admin = createAdminClient();

    if (!authCtx.isAdmin) {
      const { data: managerRecord } = await admin
        .from("ministry_members")
        .select("id")
        .eq("ministry_id", ministryId)
        .eq("profile_id", user.id)
        .eq("role", "manager")
        .eq("status", "approved")
        .maybeSingle();
      if (!managerRecord) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const { data: messages, error } = await admin
      .from("ministry_messages")
      .select("id, ministry_id, subject, body, sent_at, profiles:sender_id(first_name, last_name)")
      .eq("ministry_id", ministryId)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch ministry messages error:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    const formatted = (messages ?? []).map((msg: any) => ({
      id: msg.id,
      ministry_id: msg.ministry_id,
      subject: msg.subject,
      body: msg.body,
      sent_at: msg.sent_at,
      sender_name: msg.profiles
        ? `${msg.profiles.first_name} ${msg.profiles.last_name}`.trim()
        : "Unknown",
    }));

    return NextResponse.json({ messages: formatted });
  } catch (err) {
    console.error("[ADMIN] Ministry messages GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ministries/[id]/messages
 *
 * Send a message to all approved ministry members.
 * Body: { subject: string, body: string }
 * Accessible by admin/super_admin or the ministry's manager.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ministryId } = await params;

    const authCtx = await getAuthContext();
    if (!authCtx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = authCtx.user;
    const admin = createAdminClient();

    // Verify caller has access (admin/super_admin or ministry manager)
    if (!authCtx.isAdmin) {
      const { data: managerRecord, error: managerError } = await admin
        .from("ministry_members")
        .select("id")
        .eq("ministry_id", ministryId)
        .eq("profile_id", user.id)
        .eq("role", "manager")
        .eq("status", "approved")
        .maybeSingle();

      if (managerError) {
        console.error("[ADMIN] Check ministry manager error:", managerError);
        return NextResponse.json(
          { error: "Failed to verify access" },
          { status: 500 }
        );
      }

      if (!managerRecord) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const reqBody = await request.json();
    const { subject, body: messageBody } = reqBody;

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { error: "subject is required" },
        { status: 400 }
      );
    }

    if (!messageBody || typeof messageBody !== "string" || !messageBody.trim()) {
      return NextResponse.json(
        { error: "body is required" },
        { status: 400 }
      );
    }

    // Insert the message into ministry_messages
    const { data: message, error: messageError } = await admin
      .from("ministry_messages")
      .insert({
        ministry_id: ministryId,
        sender_id: user.id,
        subject: subject.trim(),
        body: messageBody.trim(),
      })
      .select("*")
      .single();

    if (messageError) {
      console.error("[ADMIN] Create ministry message error:", messageError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Fetch all approved members to create notifications
    const { data: approvedMembers, error: membersError } = await admin
      .from("ministry_members")
      .select("profile_id")
      .eq("ministry_id", ministryId)
      .eq("status", "approved");

    if (membersError) {
      console.error("[ADMIN] Fetch approved members for notification error:", membersError);
      // Message was sent successfully, just log the notification failure
    }

    // Create notifications for all approved members
    if (approvedMembers && approvedMembers.length > 0) {
      const notifications = approvedMembers.map((m) => ({
        profile_id: m.profile_id,
        type: "ministry_message",
        title: `New message from ministry: ${subject.trim()}`,
        body: messageBody.trim().substring(0, 200),
        metadata: {
          ministry_id: ministryId,
          message_id: message.id,
        },
      }));

      const { error: notifError } = await admin
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("[ADMIN] Create notifications error:", notifError);
        // Non-fatal: the message was still sent
      }
    }

    console.log("[AUDIT] ministry.message_sent", {
      ministryId,
      messageId: message.id,
      sentBy: user.id,
      recipientCount: approvedMembers?.length ?? 0,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message_id: message.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[ADMIN] Ministry messages POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
