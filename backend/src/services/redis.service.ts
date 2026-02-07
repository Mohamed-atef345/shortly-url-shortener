import config from "../config";
import { getRedis, isRedisHealthy } from "../config/redis";

// Cache key prefixes
const CACHE_PREFIX = {
	URL: "url:",
	RATE_LIMIT: "rl:",
	CLICK_BUFFER: "clicks:",
	TOKEN_BLACKLIST: "blacklist:",
};

// Default TTLs (in seconds)
const TTL = {
	URL_CACHE: 3600, // 1 hour
	RATE_LIMIT: 60, // 1 minute (configurable)
	CLICK_BUFFER: 300, // 5 minutes
	TOKEN_BLACKLIST: 7 * 24 * 3600, // 7 days (match JWT expiry)
};

/**
 * Redis Cache Service
 * Provides caching, rate limiting, and buffering capabilities
 */
export const RedisService = {
	/**
	 * ========================
	 * URL CACHING (for fast redirects)
	 * ========================
	 */

	/**
	 * Cache a URL mapping (shortCode -> originalUrl)
	 */
	async cacheUrl(
		shortCode: string,
		originalUrl: string,
		ttlSeconds?: number,
	): Promise<void> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.URL}${shortCode}`;
			await redis.setex(key, ttlSeconds || TTL.URL_CACHE, originalUrl);
		} catch (error) {
			console.error("Redis cacheUrl error:", error);
			// Fail silently - MongoDB is the source of truth
		}
	},

	/**
	 * Get cached URL by shortCode
	 * Returns null if not found or Redis unavailable
	 */
	async getCachedUrl(shortCode: string): Promise<string | null> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.URL}${shortCode}`;
			return await redis.get(key);
		} catch (error) {
			console.error("Redis getCachedUrl error:", error);
			return null; // Fallback to MongoDB
		}
	},

	/**
	 * Invalidate URL cache (when URL is updated or deleted)
	 */
	async invalidateUrlCache(shortCode: string): Promise<void> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.URL}${shortCode}`;
			await redis.del(key);
		} catch (error) {
			console.error("Redis invalidateUrlCache error:", error);
		}
	},

	/**
	 * ========================
	 * DISTRIBUTED RATE LIMITING
	 * ========================
	 */

	/**
	 * Check and increment rate limit for an identifier
	 * Uses sliding window algorithm
	 * Returns: { allowed: boolean, remaining: number, resetTime: number }
	 */
	async checkRateLimit(
		identifier: string,
		maxRequests: number = config.rateLimitMaxRequests,
		windowMs: number = config.rateLimitWindowMs,
	): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.RATE_LIMIT}${identifier}`;
			const now = Date.now();
			const windowStart = now - windowMs;

			// Use a transaction for atomic operations
			const multi = redis.multi();

			// Remove old entries outside the window
			multi.zremrangebyscore(key, 0, windowStart);

			// Count current requests in window
			multi.zcard(key);

			// Add current request
			multi.zadd(key, now, `${now}-${Math.random()}`);

			// Set expiry on the key
			multi.pexpire(key, windowMs);

			const results = await multi.exec();

			if (!results) {
				return {
					allowed: true,
					remaining: maxRequests,
					resetTime: now + windowMs,
				};
			}

			const currentCount = (results[1]?.[1] as number) || 0;
			const allowed = currentCount < maxRequests;
			const remaining = Math.max(0, maxRequests - currentCount - 1);

			return {
				allowed,
				remaining,
				resetTime: now + windowMs,
			};
		} catch (error) {
			console.error("Redis checkRateLimit error:", error);
			// On Redis failure, allow the request (fail open)
			return {
				allowed: true,
				remaining: maxRequests,
				resetTime: Date.now() + windowMs,
			};
		}
	},

	/**
	 * ========================
	 * CLICK ANALYTICS BUFFERING
	 * ========================
	 */

	/**
	 * Buffer a click event for batch processing
	 */
	async bufferClick(
		shortCode: string,
		clickData: {
			ip?: string;
			userAgent?: string;
			referer?: string;
			timestamp: number;
		},
	): Promise<void> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.CLICK_BUFFER}${shortCode}`;

			// Store click data as JSON in a list
			await redis.rpush(key, JSON.stringify(clickData));

			// Set expiry to prevent unbounded growth if flush fails
			await redis.expire(key, TTL.CLICK_BUFFER);

			// Also increment a simple counter for quick stats
			await redis.incr(`${CACHE_PREFIX.CLICK_BUFFER}count:${shortCode}`);
		} catch (error) {
			console.error("Redis bufferClick error:", error);
			// Fail silently - clicks can be lost in worst case
		}
	},

	/**
	 * Flush buffered clicks for a shortCode (returns and clears buffer)
	 */
	async flushClickBuffer(shortCode: string): Promise<
		Array<{
			ip?: string;
			userAgent?: string;
			referer?: string;
			timestamp: number;
		}>
	> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.CLICK_BUFFER}${shortCode}`;

			// Get all clicks and delete atomically
			const multi = redis.multi();
			multi.lrange(key, 0, -1);
			multi.del(key);
			multi.del(`${CACHE_PREFIX.CLICK_BUFFER}count:${shortCode}`);

			const results = await multi.exec();

			if (!results || !results[0]?.[1]) {
				return [];
			}

			const clicks = results[0][1] as string[];
			return clicks.map((c) => JSON.parse(c));
		} catch (error) {
			console.error("Redis flushClickBuffer error:", error);
			return [];
		}
	},

	/**
	 * Get buffered click count (quick stats without full flush)
	 */
	async getBufferedClickCount(shortCode: string): Promise<number> {
		try {
			const redis = getRedis();
			const count = await redis.get(
				`${CACHE_PREFIX.CLICK_BUFFER}count:${shortCode}`,
			);
			return parseInt(count || "0", 10);
		} catch {
			return 0;
		}
	},

	/**
	 * ========================
	 * TOKEN BLACKLISTING (for logout)
	 * ========================
	 */

	/**
	 * Blacklist a JWT token (for logout)
	 */
	async blacklistToken(
		token: string,
		expiresInSeconds?: number,
	): Promise<void> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.TOKEN_BLACKLIST}${token}`;
			await redis.setex(key, expiresInSeconds || TTL.TOKEN_BLACKLIST, "1");
		} catch (error) {
			console.error("Redis blacklistToken error:", error);
		}
	},

	/**
	 * Check if a token is blacklisted
	 */
	async isTokenBlacklisted(token: string): Promise<boolean> {
		try {
			const redis = getRedis();
			const key = `${CACHE_PREFIX.TOKEN_BLACKLIST}${token}`;
			const result = await redis.exists(key);
			return result === 1;
		} catch (error) {
			console.error("Redis isTokenBlacklisted error:", error);
			return false; // On failure, don't block valid tokens
		}
	},

	/**
	 * ========================
	 * HEALTH & UTILITIES
	 * ========================
	 */

	/**
	 * Check if Redis is available
	 */
	async isAvailable(): Promise<boolean> {
		return isRedisHealthy();
	},

	/**
	 * Clear all cache (for testing/maintenance)
	 */
	async clearAll(): Promise<void> {
		try {
			const redis = getRedis();
			const keys = await redis.keys("url:*");
			if (keys.length > 0) {
				await redis.del(...keys);
			}
		} catch (error) {
			console.error("Redis clearAll error:", error);
		}
	},
};

export default RedisService;
