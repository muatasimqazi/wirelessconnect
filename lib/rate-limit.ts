/**
 * Rate limiter using Upstash Redis.
 *
 * Returns `allowed: true` (passes) when:
 *  - Rate limit not exceeded, OR
 *  - Upstash env vars not configured (graceful degradation in dev)
 *
 * Used in checkout to prevent abuse (max 10 checkout starts / 5 minutes / IP).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let checkoutRatelimit: Ratelimit | null = null;

function getCheckoutRatelimit(): Ratelimit | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  if (!checkoutRatelimit) {
    checkoutRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "5 m"),
      prefix: "wc:checkout",
    });
  }
  return checkoutRatelimit;
}

/**
 * Check if the identifier (e.g. IP) has exceeded the checkout rate limit.
 * Returns `true` if allowed, `false` if rate-limited.
 */
export async function isCheckoutAllowed(identifier: string): Promise<boolean> {
  const rl = getCheckoutRatelimit();
  if (!rl) return true; // No Redis → allow (dev / missing config)
  const { success } = await rl.limit(identifier);
  return success;
}
