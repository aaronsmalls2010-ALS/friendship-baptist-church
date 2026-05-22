import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const callerRole = user.user_metadata?.role || user.app_metadata?.role;
    const admin = createAdminClient();

    // Verify caller has access (admin/super_admin or ministry manager)
    if (callerRole !== "admin" && callerRole !== "super_admin") {
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
