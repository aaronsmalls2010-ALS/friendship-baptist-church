/**
 * In-memory rate limiter using the token bucket algorithm.
 * Suitable for Edge Runtime and Next.js middleware.
 *
 * Note: In-memory rate limiting resets on server restart and is
 * per-instance. For distributed deployments, use a shared store
 * like Redis or Supabase.
 */

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the rate limit window resets */
  reset: number;
}

interface TokenBucket {
  /** Number of tokens (requests) remaining */
  tokens: number;
  /** Timestamp of last token refill */
  lastRefill: number;
}

interface RateLimitOptions {
  /** Time window in milliseconds */
  interval: number;
  /** Maximum number of unique tokens (clients) to track per interval */
  uniqueTokenPerInterval: number;
}

interface RateLimiter {
  /**
   * Check if a request identified by `token` is within the rate limit.
   * @param limit Maximum number of requests allowed per interval
   * @param token Unique identifier for the client (e.g., IP address)
   */
  check(limit: number, token: string): Promise<RateLimitResult>;
}

/**
 * Create a rate limiter instance with the given options.
 *
 * Uses a token bucket algorithm: each unique client gets a bucket
 * that refills to `limit` tokens every `interval` milliseconds.
 * Expired buckets are automatically cleaned up to prevent memory leaks.
 */
export function createRateLimit(opts: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, TokenBucket>();
  let lastCleanup = Date.now();

  /**
   * Remove expired buckets to prevent unbounded memory growth.
   * Runs at most once per interval.
   */
  function cleanup(): void {
    const now = Date.now();
    if (now - lastCleanup < opts.interval) return;

    lastCleanup = now;
    const expireThreshold = now - opts.interval * 2;

    for (const [key, bucket] of buckets.entries()) {
      if (bucket.lastRefill < expireThreshold) {
        buckets.delete(key);
      }
    }

    // If we still have too many entries, remove the oldest ones
    if (buckets.size > opts.uniqueTokenPerInterval) {
      const entries = Array.from(buckets.entries()).sort(
        (a, b) => a[1].lastRefill - b[1].lastRefill
      );
      const toRemove = entries.slice(
        0,
        entries.length - opts.uniqueTokenPerInterval
      );
      for (const [key] of toRemove) {
        buckets.delete(key);
      }
    }
  }

  return {
    check(limit: number, token: string): Promise<RateLimitResult> {
      return new Promise((resolve) => {
        cleanup();

        const now = Date.now();
        const bucket = buckets.get(token);
        const reset = now + opts.interval;

        if (!bucket) {
          // First request from this token — create a new bucket
          buckets.set(token, {
            tokens: limit - 1,
            lastRefill: now,
          });
          resolve({ success: true, remaining: limit - 1, reset });
          return;
        }

        // Calculate elapsed time and refill tokens proportionally
        const elapsed = now - bucket.lastRefill;

        if (elapsed >= opts.interval) {
          // Full interval elapsed — refill the bucket completely
          bucket.tokens = limit - 1;
          bucket.lastRefill = now;
          resolve({ success: true, remaining: limit - 1, reset });
          return;
        }

        // Within the same interval — consume a token
        if (bucket.tokens > 0) {
          bucket.tokens -= 1;
          const resetTime = bucket.lastRefill + opts.interval;
          resolve({
            success: true,
            remaining: bucket.tokens,
            reset: resetTime,
          });
        } else {
          const resetTime = bucket.lastRefill + opts.interval;
          resolve({
            success: false,
            remaining: 0,
            reset: resetTime,
          });
        }
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Preset rate limiters
// ---------------------------------------------------------------------------

/** Authentication rate limit: 5 attempts per 15 minutes */
export const authRateLimit = createRateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
});

/** General API rate limit: 100 requests per minute */
export const apiRateLimit = createRateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
});

/** Form submission rate limit: 10 submissions per hour */
export const formRateLimit = createRateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});
