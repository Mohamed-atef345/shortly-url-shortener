import { rateLimit } from "elysia-rate-limit";
import config from "../config";

/**
 * General rate limiting middleware
 * Limits requests per IP address
 */
export const rateLimitMiddleware = rateLimit({
	duration: config.rateLimitWindowMs,
	max: config.rateLimitMaxRequests,
	generator: (request) => {
		// Use IP address as identifier
		return (
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			request.headers.get("x-real-ip") ||
			"unknown"
		);
	},
	headers: true,
});

/**
 * Stricter rate limit for authentication endpoints
 * 5 attempts per 15 minutes
 */
export const authRateLimitMiddleware = rateLimit({
	duration: 900000, // 15 minutes
	max: 5,
	generator: (request) => {
		return (
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			request.headers.get("x-real-ip") ||
			"unknown"
		);
	},
	headers: true,
});

/**
 * Rate limit specifically for URL creation
 * 30 URLs per minute per user
 */
export const urlCreationRateLimitMiddleware = rateLimit({
	duration: 60000, // 1 minute
	max: 30,
	generator: (request) => {
		return (
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			request.headers.get("x-real-ip") ||
			"unknown"
		);
	},
	headers: true,
});
