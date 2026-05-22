import { z, type ZodSchema } from 'zod';

/**
 * Input sanitization utilities for preventing XSS, injection, and
 * other input-based attacks.
 */

/**
 * Strip all HTML tags, script content, and event handlers from input.
 * Removes <script> blocks (including content), on* event attributes,
 * javascript: protocol URIs, and all remaining HTML tags.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Remove script tags and their content (case-insensitive, handles multiline)
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove noscript tags and their content
  sanitized = sanitized.replace(
    /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
    ''
  );

  // Remove style tags and their content
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  );

  // Remove event handler attributes (on*)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: protocol URIs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: URIs that could contain scripts
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

  // Remove all remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Re-encode angle brackets to prevent reconstructed tags
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return sanitized.trim();
}

/**
 * General-purpose input sanitization.
 * Trims whitespace, normalizes internal whitespace, removes null bytes
 * and control characters (preserving newlines and tabs).
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (U+0000-U+001F, U+007F-U+009F)
  // Preserve newlines (\n = 0x0A), carriage returns (\r = 0x0D), and tabs (\t = 0x09)
  sanitized = sanitized.replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,
    ''
  );

  // Normalize whitespace: collapse multiple spaces/tabs into single space
  sanitized = sanitized.replace(/[^\S\n]+/g, ' ');

  // Collapse multiple newlines into at most two
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim leading and trailing whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize and validate an email address.
 * Lowercases, trims, and validates against a standard email regex.
 * Returns empty string if invalid.
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  let sanitized = email.trim().toLowerCase();

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Basic email format validation (RFC 5322 simplified)
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return '';
  }

  // Additional validation: must have at least one dot in domain
  const [, domain] = sanitized.split('@');
  if (!domain || !domain.includes('.')) {
    return '';
  }

  // Max length check (RFC 5321)
  if (sanitized.length > 254) {
    return '';
  }

  return sanitized;
}

/**
 * Validate and sanitize form data against a Zod schema.
 * Returns typed, validated data or a list of human-readable errors.
 */
export function sanitizeFormData<T>(
  data: Record<string, unknown>,
  schema: ZodSchema<T>
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });

    return { success: false, errors };
  } catch {
    return {
      success: false,
      errors: ['An unexpected error occurred during validation.'],
    };
  }
}

/**
 * Escape special characters for safe logging output.
 * Prevents log injection attacks by escaping newlines, carriage returns,
 * tabs, and other control characters that could forge log entries.
 */
export function escapeForLog(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/\\/g, '\\\\')     // Escape backslashes first
    .replace(/\n/g, '\\n')       // Escape newlines
    .replace(/\r/g, '\\r')       // Escape carriage returns
    .replace(/\t/g, '\\t')       // Escape tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, (char) => {
      // Escape remaining control characters as Unicode escapes
      return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
    });
}

// Re-export zod for convenience in form validation
export { z };
