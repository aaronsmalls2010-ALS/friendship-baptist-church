/**
 * Audit logging utilities for security-relevant events.
 *
 * In development, events are logged to the console.
 * In production, this should be extended to persist events to
 * a Supabase audit_log table for compliance and investigation.
 */

/**
 * Supported audit event types organized by category.
 */
export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.password_reset'
  | 'auth.failed_login'
  | 'auth.email_verified'
  | 'profile.update'
  | 'admin.action'
  | 'security.rate_limited'
  | 'security.csrf_failed';

export interface AuditEvent {
  /** The type/category of the event */
  type: AuditEventType;
  /** The authenticated user's ID, if available */
  userId?: string;
  /** Client IP address */
  ip?: string;
  /** Client user agent string */
  userAgent?: string;
  /** Additional context-specific data */
  metadata?: Record<string, unknown>;
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;
}

/**
 * Extract client information from an incoming request.
 *
 * Reads the IP from standard proxy headers (x-forwarded-for, x-real-ip)
 * and falls back to 'unknown'. Also extracts the user agent.
 *
 * @param request The incoming Request object
 * @returns Object with ip and userAgent strings
 */
export function getClientInfo(request: Request): {
  ip: string;
  userAgent: string;
} {
  const headers = request.headers;

  // Try x-forwarded-for first (may contain comma-separated list of IPs)
  const forwarded = headers.get('x-forwarded-for');
  let ip: string;

  if (forwarded) {
    // The first IP in the list is the original client IP
    ip = forwarded.split(',')[0].trim();
  } else {
    // Fall back to x-real-ip header
    ip = headers.get('x-real-ip') ?? 'unknown';
  }

  // Validate that the IP looks reasonable (not empty, not just whitespace)
  if (!ip || ip.trim().length === 0) {
    ip = 'unknown';
  }

  const userAgent = headers.get('user-agent') ?? 'unknown';

  return { ip, userAgent };
}

/**
 * Log an audit event.
 *
 * In development (NODE_ENV !== 'production'), events are written
 * to the console with structured formatting.
 *
 * In production, this function should be extended to persist events
 * to a Supabase `audit_log` table. The table schema should match
 * the AuditEvent interface.
 *
 * @param event The audit event to log (timestamp is added automatically)
 *
 * @example
 * ```ts
 * logAuditEvent({
 *   type: 'auth.login',
 *   userId: user.id,
 *   ip: clientInfo.ip,
 *   userAgent: clientInfo.userAgent,
 *   metadata: { method: 'email' },
 * });
 * ```
 */
export function logAuditEvent(
  event: Omit<AuditEvent, 'timestamp'>
): void {
  const auditEntry: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'production') {
    // Production: structured JSON logging for log aggregation services.
    // TODO: Replace with Supabase insert when audit_log table is created.
    //
    // Example Supabase implementation:
    // ```ts
    // import { createClient } from '@supabase/supabase-js';
    // const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    // await supabase.from('audit_log').insert(auditEntry);
    // ```
    console.log(JSON.stringify({ audit: auditEntry }));
  } else {
    // Development: human-readable console output
    const severity = getSeverity(auditEntry.type);
    const prefix = `[AUDIT:${severity}]`;
    const summary = [
      prefix,
      auditEntry.type,
      auditEntry.userId ? `user=${auditEntry.userId}` : null,
      auditEntry.ip ? `ip=${auditEntry.ip}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    if (severity === 'WARN' || severity === 'ERROR') {
      console.warn(summary, auditEntry.metadata ?? '');
    } else {
      console.info(summary, auditEntry.metadata ?? '');
    }
  }
}

/**
 * Determine the severity level of an audit event for log categorization.
 */
function getSeverity(
  type: AuditEventType
): 'INFO' | 'WARN' | 'ERROR' {
  switch (type) {
    case 'auth.failed_login':
    case 'security.rate_limited':
    case 'security.csrf_failed':
      return 'WARN';
    case 'admin.action':
      return 'INFO';
    case 'auth.login':
    case 'auth.logout':
    case 'auth.signup':
    case 'auth.password_reset':
    case 'auth.email_verified':
    case 'profile.update':
    default:
      return 'INFO';
  }
}
