/**
 * Simple bot detection for public-facing POST endpoints.
 *
 * This is a lightweight defense layer — not a replacement for CAPTCHA.
 * It catches the most common automated scrapers and spambots that:
 *   1. Don't send a User-Agent header
 *   2. Use known bot User-Agent strings
 *   3. Send requests with suspicious headers
 *
 * Legitimate users with unusual User-Agents will not be blocked;
 * they will just be flagged for honeypot-based filtering at the
 * application level.
 */

/** Known bot User-Agent substrings (case-insensitive matching) */
const BOT_UA_PATTERNS = [
  'bot',
  'crawl',
  'spider',
  'scrape',
  'curl',
  'wget',
  'httpie',
  'python-requests',
  'python-urllib',
  'go-http-client',
  'java/',
  'libwww-perl',
  'mechanize',
  'scrapy',
  'phantomjs',
  'headlesschrome',
  'selenium',
  'puppeteer',
  'playwright',
  'httrack',
  'ahrefs',
  'semrush',
  'mj12bot',
  'dotbot',
  'bytespider',
  'gptbot',
  'claudebot',
  'ccbot',
];

/**
 * Check if a request is likely from an automated bot.
 *
 * Criteria:
 * - Missing or empty User-Agent header
 * - User-Agent matches known bot patterns
 *
 * @param request The incoming Next.js request
 * @returns true if the request appears to be from a bot
 */
export function isLikelyBot(request: { headers: Headers }): boolean {
  const userAgent = request.headers.get('user-agent');

  // No User-Agent at all — almost certainly automated
  if (!userAgent || userAgent.trim().length === 0) {
    return true;
  }

  // Check against known bot patterns (case-insensitive)
  const lowerUA = userAgent.toLowerCase();
  for (const pattern of BOT_UA_PATTERNS) {
    if (lowerUA.includes(pattern)) {
      return true;
    }
  }

  return false;
}
