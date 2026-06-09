import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, getClientInfo } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/memorials/[id]/comments
 *
 * Deletes a memorial comment by comment_id (passed in body).
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: memorialId } = await params;
  let body: { commentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("memorial_comments")
    .delete()
    .eq("id", body.commentId)
    .eq("memorial_id", memorialId);

  if (error) {
    console.error("[ADMIN] Delete memorial comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }

  const { ip, userAgent } = getClientInfo(request);
  await logAuditEvent({
    type: "memorial.delete",
    userId: auth.user.id,
    resourceType: "memorial_comment",
    resourceId: body.commentId,
    metadata: { memorialId, action: "comment_delete" },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
