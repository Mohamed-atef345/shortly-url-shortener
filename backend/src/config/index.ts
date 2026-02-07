// Validate JWT_SECRET in production - throw error if not set to prevent token forgery
const getJwtSecret = (): string => {
	const secret = process.env.JWT_SECRET;
	const nodeEnv = process.env.NODE_ENV || "development";

	if (nodeEnv === "production" && !secret) {
		throw new Error(
			"CRITICAL: JWT_SECRET environment variable must be set in production. " +
				"Using a default secret in production allows attackers to forge authentication tokens.",
		);
	}

	if (!secret) {
		console.warn(
			"⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable for production.",
		);
		return "default-secret-change-in-production";
	}

	return secret;
};

export const config = {
	// Server
	port: parseInt(process.env.PORT || "3001", 10),
	nodeEnv: process.env.NODE_ENV || "development",

	// Database
	mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/shortly",

	// Redis
	redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
	redisPassword: process.env.REDIS_PASSWORD || undefined,
	redisEnabled: process.env.REDIS_ENABLED !== "false", // Enable by default

	// JWT
	jwtSecret: getJwtSecret(),
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

	// Azure Entra ID
	azureTenantId: process.env.AZURE_TENANT_ID,
	azureClientId: process.env.AZURE_CLIENT_ID,
	azureClientSecret: process.env.AZURE_CLIENT_SECRET,

	// Rate Limiting
	rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
	rateLimitMaxRequests: parseInt(
		process.env.RATE_LIMIT_MAX_REQUESTS || "500",
		10,
	),

	// URL Settings
	baseUrl: process.env.BASE_URL || "http://localhost:3001",
	frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
	urlExpiryDays: parseInt(process.env.URL_EXPIRY_DAYS || "30", 10),
};

export default config;
