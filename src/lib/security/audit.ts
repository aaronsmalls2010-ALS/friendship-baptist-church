/**
 * Audit logging — writes to the audit_log table via the service-role client.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.signup"
  | "auth.password_reset"
  | "auth.failed_login"
  | "auth.email_verified"
  | "profile.update"
  | "profile.archive"
  | "profile.restore"
  | "member.create"
  | "member.update"
  | "member.archive"
  | "member.restore"
  | "donation.create"
  | "donation.update"
  | "donation.void"
  | "donation.refund"
  | "donation.archive"
  | "donation.restore"
  | "donation.export"
  | "donation_type.create"
  | "donation_type.update"
  | "donation_type.deactivate"
  | "memorial.create"
  | "memorial.update"
  | "memorial.delete"
  | "memorial.archive"
  | "attendance.create"
  | "attendance.update"
  | "attendance.delete"
  | "attendance.record"
  | "role.grant"
  | "role.revoke"
  | "settings.update"
  | "export.csv"
  | "export.pdf"
  | "admin.action"
  | "security.rate_limited"
  | "security.csrf_failed";

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export function getClientInfo(request: Request): {
  ip: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  let ip = forwarded
    ? forwarded.split(",")[0].trim()
    : (request.headers.get("x-real-ip") ?? "unknown");
  if (!ip.trim()) ip = "unknown";
  return { ip, userAgent: request.headers.get("user-agent") ?? "unknown" };
}

export async function logAuditEvent(
  event: Omit<AuditEvent, "timestamp">
): Promise<void> {
  const entry: AuditEvent = { ...event, timestamp: new Date().toISOString() };

  if (process.env.NODE_ENV !== "production") {
    const label = `[AUDIT] ${entry.type}${entry.userId ? ` user=${entry.userId}` : ""}`;
    console.info(label, entry.metadata ?? "");
    return;
  }

  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      user_id: entry.userId ?? null,
      action: entry.type,
      resource_type: entry.resourceType ?? entry.type.split(".")[0],
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ip ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch (err) {
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}
