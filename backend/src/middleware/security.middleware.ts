import { Elysia } from "elysia";
import config from "../config";

/**
 * Security Headers Middleware
 * Adds essential security headers to all responses
 */
export const securityMiddleware = new Elysia({ name: "security" }).onRequest(
	({ request, set }) => {
		// Skip security headers for Swagger docs to allow loading of CDN scripts
		if (!request.url.includes("/swagger")) {
			// Prevent MIME type sniffing
			set.headers["X-Content-Type-Options"] = "nosniff";

			// Prevent clickjacking
			set.headers["X-Frame-Options"] = "DENY";

			// Enable XSS filter
			set.headers["X-XSS-Protection"] = "1; mode=block";

			// Control referrer information
			set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

			// Disable unnecessary browser features
			set.headers["Permissions-Policy"] =
				"geolocation=(), microphone=(), camera=(), payment=()";

			// Remove powered-by header to hide tech stack
			set.headers["X-Powered-By"] = "";

			// Enable HSTS in production
			if (config.nodeEnv === "production") {
				set.headers["Strict-Transport-Security"] =
					"max-age=31536000; includeSubDomains; preload";
			}
		}
	},
);

/**
 * Request ID Middleware
 * Adds unique request ID for tracing
 */
export const requestIdMiddleware = new Elysia({ name: "request-id" }).derive(
	({ set }) => {
		const requestId = crypto.randomUUID();
		set.headers["X-Request-ID"] = requestId;
		return { requestId };
	},
);
