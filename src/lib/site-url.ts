/**
 * Canonical site origin for building absolute links (verification, reset, etc.).
 *
 * Reads NEXT_PUBLIC_SITE_URL but defends against the classic copy-paste hazards
 * that silently break every emailed link:
 *   - a leading BOM (U+FEFF) pasted in front of "https" → browsers can't resolve
 *     the host (DNS_PROBE_FINISHED_NXDOMAIN / "typo in https")
 *   - stray surrounding whitespace or newlines
 *   - a trailing slash (so we don't emit "...com//auth/...")
 */
const BOM_RE = new RegExp("^" + String.fromCharCode(0xfeff));

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const cleaned = raw.replace(BOM_RE, "").trim().replace(/\/+$/, "");
  return cleaned || "https://thefriendshipbaptist.com";
}
