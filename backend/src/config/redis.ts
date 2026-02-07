import Redis from "ioredis";
import config from "./index";

let redis: Redis | null = null;

/**
 * Get or create Redis connection
 */
export const getRedis = (): Redis => {
	if (!redis) {
		const options: any = {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			retryStrategy: (times: number) => {
				if (times > 3) {
					console.error("Redis: Max retry attempts reached, giving up");
					return null; // Stop retrying
				}
				return Math.min(times * 200, 2000); // Exponential backoff, max 2s
			},
		};

		// Only add password if it's set and not empty
		if (config.redisPassword) {
			options.password = config.redisPassword;
		}

		redis = new Redis(config.redisUrl, options);

		redis.on("connect", () => {
			console.log("✅ Redis connected successfully");
		});

		redis.on("ready", () => {
			console.log("✅ Redis ready to accept commands");
		});

		redis.on("error", (err) => {
			console.error("❌ Redis error:", err.message);
		});

		redis.on("close", () => {
			console.log("🔌 Redis connection closed");
		});
	}

	return redis;
};

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<void> => {
	try {
		const client = getRedis();
		// Just ping to verify connection
		await client.ping();
		console.log("✅ Redis ping successful");
	} catch (error: any) {
		console.error("Failed to connect to Redis:", error.message);
		// Don't throw - allow app to work without Redis (graceful degradation)
	}
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
	if (redis) {
		await redis.quit();
		redis = null;
	}
};

/**
 * Check if Redis is connected and healthy
 */
export const isRedisHealthy = async (): Promise<boolean> => {
	try {
		if (!redis) return false;
		const pong = await redis.ping();
		return pong === "PONG";
	} catch {
		return false;
	}
};

export default getRedis;
