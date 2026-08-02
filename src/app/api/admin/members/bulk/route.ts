import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type BulkAction = "archive" | "set_status" | "add_tag" | "remove_tag";
const ACTIONS: BulkAction[] = ["archive", "set_status", "add_tag", "remove_tag"];
const STATUSES = ["active", "inactive", "visitor", "deceased"];

/**
 * POST /api/admin/members/bulk
 *
 * Applies one action to many members at once:
 *   { ids: string[], action, value? }
 *   - archive      → set archived_at = now() on those ids
 *   - set_status   → set status = value (member_status enum)
 *   - add_tag      → insert profile_tags rows (value = tag_id)
 *   - remove_tag   → delete profile_tags rows (value = tag_id)
 *
 * Requires admin or super_admin. The action is written to the audit log.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids, action, value } = body as {
    ids?: unknown;
    action?: unknown;
    value?: unknown;
  };

  // ── Validate ids ────────────────────────────────────────────────
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No members selected" }, { status: 400 });
  }
  const cleanIds = ids.filter((x): x is string => typeof x === "string" && x.length > 0);
  if (cleanIds.length === 0) {
    return NextResponse.json({ error: "No valid member IDs" }, { status: 400 });
  }
  if (cleanIds.length > 1000) {
    return NextResponse.json({ error: "Too many members in one operation" }, { status: 400 });
  }

  // ── Validate action ─────────────────────────────────────────────
  if (typeof action !== "string" || !ACTIONS.includes(action as BulkAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  try {
    if (action === "archive") {
      // Don't let an admin archive their own account in a bulk sweep.
      const targets = cleanIds.filter((id) => id !== auth.user.id);
      if (targets.length === 0) {
        return NextResponse.json({ error: "Cannot archive your own account" }, { status: 400 });
      }
      const { error } = await admin
        .from("profiles")
        .update({ archived_at: now, archived_by: auth.user.id })
        .in("id", targets);
      if (error) throw error;
    } else if (action === "set_status") {
      if (typeof value !== "string" || !STATUSES.includes(value)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      const { error } = await admin
        .from("profiles")
        .update({ status: value, updated_at: now })
        .in("id", cleanIds);
      if (error) throw error;
    } else if (action === "add_tag") {
      if (typeof value !== "string" || !value) {
        return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
      }
      const rows = cleanIds.map((profile_id) => ({ profile_id, tag_id: value }));
      // Ignore duplicates so re-tagging an already-tagged member is a no-op.
      const { error } = await admin
        .from("profile_tags")
        .upsert(rows, { onConflict: "profile_id,tag_id", ignoreDuplicates: true });
      if (error) throw error;
    } else if (action === "remove_tag") {
      if (typeof value !== "string" || !value) {
        return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
      }
      const { error } = await admin
        .from("profile_tags")
        .delete()
        .eq("tag_id", value)
        .in("profile_id", cleanIds);
      if (error) throw error;
    }
  } catch (err) {
    console.error("[ADMIN] Bulk members error:", err);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: {
      action: `member.bulk.${action}`,
      count: cleanIds.length,
      value: typeof value === "string" ? value : undefined,
    },
    userId: auth.user.id,
    resourceType: "member",
    ip,
    userAgent,
  });

  return NextResponse.json({ success: true, count: cleanIds.length });
}
