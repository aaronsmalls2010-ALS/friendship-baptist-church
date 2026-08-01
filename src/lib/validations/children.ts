/**
 * Shared sanitizer for the portal children/dependents API.
 *
 * The guardian_id and family_id are always assigned by the server, never the
 * client, so they are intentionally NOT part of this payload.
 */

/** Editable string fields on a child record, with reasonable length caps. */
const FIELD_LIMITS: Record<string, number> = {
  first_name: 100,
  last_name: 100,
  grade: 50,
  allergies: 1000,
  notes: 2000,
};

/**
 * Build a clean update/insert payload from a request body.
 * - Trims and caps string fields to their limit (empty → null).
 * - Accepts birthdate as a date string (or null).
 * Returns only the fields actually present in the body.
 */
export function sanitizeChildFields(
  body: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
    if (key in body) {
      const raw = body[key];
      if (raw === null || raw === undefined) {
        out[key] = null;
      } else {
        out[key] = String(raw).trim().slice(0, limit) || null;
      }
    }
  }

  if ("birthdate" in body) {
    const bd = body.birthdate;
    out.birthdate = bd ? String(bd).slice(0, 10) : null;
  }

  return out;
}
