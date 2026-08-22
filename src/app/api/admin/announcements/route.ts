import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCongregation } from "@/lib/push/notify";

// notifyCongregation reaches web-push, which needs the Node runtime.
export const runtime = "nodejs";

type AnnouncementRow = { title: string; body: string };

/**
 * Push + in-app notify the congregation about an announcement. Gated by each
 * member's `notify_newsletter` preference. Never throws into the caller.
 */
async function notifyAboutAnnouncement(announcement: AnnouncementRow) {
  try {
    const result = await notifyCongregation({
      topic: "announcement",
      title: announcement.title,
      body: announcement.body,
      url: "/portal",
      tag: "announcement",
    });
    return { sent: result.sent, inApp: result.inApp, note: result.note };
  } catch (err) {
    console.error("[ADMIN] Announcement notify error:", err);
    return { sent: 0, inApp: 0, note: "Notification failed to send." };
  }
}

/**
 * GET /api/admin/announcements
 *
 * Fetches all announcements ordered by created_at desc.
 * Requires admin or super_admin role.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const admin = createAdminClient();
    const { data: announcements, error } = await admin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Fetch announcements error:", error);
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements: announcements ?? [] });
  } catch (err) {
    console.error("[ADMIN] Announcements GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 *
 * Creates a new announcement.
 * Requires admin or super_admin role.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { title, body: announcementBody, start_date, end_date, is_pinned, is_published, category, notify } = body;

    if (!title || !announcementBody) {
      return NextResponse.json(
        { error: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    if (category !== undefined && typeof category !== "string") {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: announcement, error } = await admin
      .from("announcements")
      .insert({ title, body: announcementBody, start_date, end_date, is_pinned, is_published, category })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Create announcement error:", error);
      return NextResponse.json(
        { error: "Failed to create announcement" },
        { status: 500 }
      );
    }

    // Only notify when the admin explicitly ticked the box — never on a plain
    // save, so a typo fix can't blast the congregation a second time.
    const notification = notify === true ? await notifyAboutAnnouncement(announcement) : null;

    return NextResponse.json({ announcement, notification }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN] Announcements POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/announcements
 *
 * Updates an existing announcement.
 * Requires admin or super_admin role.
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...raw } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    if (raw.category !== undefined && typeof raw.category !== "string") {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const allowed = ["title", "body", "start_date", "end_date", "is_pinned", "is_published", "category"];
    const fields: Record<string, unknown> = {};
    for (const k of allowed) { if (k in raw) fields[k] = raw[k]; }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("announcements")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const { data: announcement, error } = await admin
      .from("announcements")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN] Update announcement error:", error);
      return NextResponse.json(
        { error: "Failed to update announcement" },
        { status: 500 }
      );
    }

    const notification = raw.notify === true ? await notifyAboutAnnouncement(announcement) : null;

    return NextResponse.json({ announcement, notification });
  } catch (err) {
    console.error("[ADMIN] Announcements PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements
 *
 * Deletes an announcement.
 * Requires admin or super_admin role.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify record exists
    const { data: existing, error: fetchError } = await admin
      .from("announcements")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const { error } = await admin.from("announcements").delete().eq("id", id);

    if (error) {
      console.error("[ADMIN] Delete announcement error:", error);
      return NextResponse.json(
        { error: "Failed to delete announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN] Announcements DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
