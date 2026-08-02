import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

/**
 * DELETE /api/admin/tags/[id]
 *
 * Deletes a tag. Its profile_tags rows are removed automatically via the
 * ON DELETE CASCADE foreign key. Requires admin or super_admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("tags").delete().eq("id", id);

  if (error) {
    console.error("[ADMIN] Delete tag error:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "admin.action",
    metadata: { action: "tag.delete" },
    userId: auth.user.id,
    resourceType: "tag",
    resourceId: id,
    ip,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
