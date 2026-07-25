/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance deployments (Vercel serverless, single server).
 * For multi-instance, swap with Upstash Redis or similar.
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(
	() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now > entry.resetTime) {
				store.delete(key);
			}
		}
	},
	5 * 60 * 1000,
);

export interface RateLimitResult {
	success: boolean;
	remaining: number;
	retryAfterMs: number;
}

/**
 * Check and increment rate limit for a given key.
 *
 * @param key - Unique identifier (e.g. IP, user ID, or combined)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
	key: string,
	maxRequests: number = 10,
	windowMs: number = 60_000,
): RateLimitResult {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now > entry.resetTime) {
		store.set(key, { count: 1, resetTime: now + windowMs });
		return { success: true, remaining: maxRequests - 1, retryAfterMs: 0 };
	}

	if (entry.count >= maxRequests) {
		const retryAfterMs = entry.resetTime - now;
		return { success: false, remaining: 0, retryAfterMs };
	}

	entry.count++;
	return {
		success: true,
		remaining: maxRequests - entry.count,
		retryAfterMs: 0,
	};
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard reverse proxies.
 */
export function getClientIp(headers: Headers): string {
	return (
		headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		headers.get("x-real-ip") ??
		"unknown"
	);
}
