import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import config from "./config";
import { connectDatabase } from "./config/database";
import { connectRedis, isRedisHealthy } from "./config/redis";
import {
	rateLimitMiddleware,
	requestIdMiddleware,
	securityMiddleware,
} from "./middleware";
import { adminRoutes, authRoutes, redirectRoutes, urlRoutes } from "./routes";

// Connect to database
await connectDatabase();

// Connect to Redis (non-blocking - app works without Redis)
if (config.redisEnabled) {
	await connectRedis();
}

// OpenAPI specification
const openApiSpec = {
	openapi: "3.0.3",
	info: {
		title: "Shortly API",
		version: "1.0.0",
		description:
			"URL Shortener API with authentication, analytics, and multi-cloud support",
		contact: { name: "Shortly Team" },
	},
	tags: [
		{ name: "Auth", description: "Authentication endpoints" },
		{ name: "URLs", description: "URL management endpoints" },
		{ name: "Redirect", description: "URL redirect endpoints" },
		{ name: "Admin", description: "Admin-only endpoints" },
	],
	paths: {
		"/health": {
			get: {
				summary: "Health check",
				responses: { "200": { description: "OK" } },
			},
		},
		"/api/auth/register": {
			post: {
				tags: ["Auth"],
				summary: "Register a new user",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["name", "email", "password"],
								properties: {
									name: { type: "string", minLength: 2, maxLength: 50 },
									email: { type: "string", format: "email" },
									password: { type: "string", minLength: 8 },
								},
							},
						},
					},
				},
				responses: { "200": { description: "User registered successfully" } },
			},
		},
		"/api/auth/login": {
			post: {
				tags: ["Auth"],
				summary: "Login user",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["email", "password"],
								properties: {
									email: { type: "string", format: "email" },
									password: { type: "string" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Login successful" } },
			},
		},
		"/api/auth/me": {
			get: {
				tags: ["Auth"],
				summary: "Get current user",
				security: [{ bearerAuth: [] }],
				responses: { "200": { description: "User profile" } },
			},
		},
		"/api/auth/delete-account": {
			delete: {
				tags: ["Auth"],
				summary: "Delete account",
				security: [{ bearerAuth: [] }],
				responses: { "200": { description: "Account deleted" } },
			},
		},
		"/api/urls": {
			post: {
				tags: ["URLs"],
				summary: "Create short URL",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["url"],
								properties: {
									url: { type: "string", format: "uri" },
									customSlug: { type: "string", minLength: 3, maxLength: 50 },
									expiryDays: { type: "number", minimum: 1, maximum: 365 },
								},
							},
						},
					},
				},
				responses: { "200": { description: "URL created" } },
			},
			get: {
				tags: ["URLs"],
				summary: "List user's URLs",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "page",
						in: "query",
						schema: { type: "integer", minimum: 1 },
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", minimum: 1, maximum: 100 },
					},
				],
				responses: { "200": { description: "List of URLs" } },
			},
		},
		"/api/urls/{shortCode}/analytics": {
			get: {
				tags: ["URLs"],
				summary: "Get URL analytics",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "shortCode",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: { "200": { description: "URL analytics" } },
			},
		},
		"/api/urls/{shortCode}": {
			delete: {
				tags: ["URLs"],
				summary: "Delete URL",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "shortCode",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: { "200": { description: "URL deleted" } },
			},
		},
		"/{shortCode}": {
			get: {
				tags: ["Redirect"],
				summary: "Redirect short URL",
				parameters: [
					{
						name: "shortCode",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: { "302": { description: "Redirect to original URL" } },
			},
		},
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
};

// Swagger UI HTML
const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shortly API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`;

// Create Elysia app
const app = new Elysia()
	// Global middleware
	.use(requestIdMiddleware)
	.use(securityMiddleware)
	.use(
		cors({
			origin: config.frontendUrl,
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		}),
	)
	.use(rateLimitMiddleware)

	// Custom Swagger UI (standalone implementation)
	.get("/swagger", ({ set }) => {
		set.headers["Content-Type"] = "text/html";
		return swaggerHtml;
	})
	.get("/docs", ({ set }) => {
		set.headers["Content-Type"] = "text/html";
		return swaggerHtml;
	})
	.get("/docs/openapi.json", () => openApiSpec)

	// Health check endpoint
	.get("/health", async () => {
		const redisHealthy = config.redisEnabled ? await isRedisHealthy() : null;

		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			environment: config.nodeEnv,
			services: {
				redis: {
					enabled: config.redisEnabled,
					healthy: redisHealthy,
				},
			},
		};
	})

	// API Routes
	.use(authRoutes)
	.use(urlRoutes)
	.use(adminRoutes)

	// Redirect routes (catch-all for short links - must be last)
	.use(redirectRoutes)

	// Global error handler
	.onError(({ code, error, set }) => {
		const errorMessage = "message" in error ? error.message : String(error);
		console.error(`[Error] ${code}:`, errorMessage);

		// Handle validation errors
		if (code === "VALIDATION") {
			set.status = 400;
			return {
				success: false,
				error: "Validation failed",
				details: errorMessage,
			};
		}

		// Handle not found
		if (code === "NOT_FOUND") {
			set.status = 404;
			return {
				success: false,
				error: "Resource not found",
			};
		}

		// Handle other errors
		let status = 500;
		if (error && typeof error === "object" && "status" in error) {
			const s = (error as Record<string, unknown>).status;
			if (typeof s === "number") {
				status = s;
			}
		}
		set.status = status;

		return {
			success: false,
			error: errorMessage || "Internal server error",
		};
	});

// Start server
const server = app.listen(config.port);

// Log only after server object is created
if (server) {
	console.log(`
🦊 Shortly API is running!
📍 Server: http://localhost:${config.port}
📚 Swagger: http://localhost:${config.port}/swagger
🏥 Health: http://localhost:${config.port}/health
🌍 Environment: ${config.nodeEnv}
`);
}

// Export app type for Eden Treaty (frontend type-safe client)
export type App = typeof app;
export default app;
