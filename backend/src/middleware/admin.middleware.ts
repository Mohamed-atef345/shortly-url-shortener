import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import config from "../config";
import { AuthProvider, type IUser, User, UserRole } from "../models";

// JWKS client for Azure Entra ID public keys
const client = jwksClient({
	jwksUri: `https://login.microsoftonline.com/${config.azureTenantId}/discovery/v2.0/keys`,
	cache: true,
	cacheMaxEntries: 5,
	cacheMaxAge: 600000, // 10 minutes
});

/**
 * Get signing key from JWKS
 */
const getKey = (
	header: jwt.JwtHeader,
	callback: jwt.SigningKeyCallback,
): void => {
	client.getSigningKey(header.kid, (err, key) => {
		if (err) {
			return callback(err);
		}
		const signingKey = key?.getPublicKey();
		callback(null, signingKey);
	});
};

/**
 * Verify Azure Entra ID token
 */
const verifyEntraToken = (token: string): Promise<jwt.JwtPayload> => {
	return new Promise((resolve, reject) => {
		jwt.verify(
			token,
			getKey,
			{
				audience: config.azureClientId,
				issuer: `https://login.microsoftonline.com/${config.azureTenantId}/v2.0`,
			},
			(err, decoded) => {
				if (err || !decoded) {
					reject(new Error("Invalid Entra ID token"));
					return;
				}
				resolve(decoded as jwt.JwtPayload);
			},
		);
	});
};

/**
 * Azure Entra ID Authentication Middleware for Admin users
 */
export const adminAuthMiddleware = new Elysia({ name: "admin-auth" }).derive(
	async ({ headers, set }) => {
		const authHeader = headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			set.status = 401;
			throw new Error("Unauthorized: No token provided");
		}

		const token = authHeader.substring(7);

		try {
			// Verify the Entra ID token
			const decoded = await verifyEntraToken(token);

			const azureId = decoded.oid;
			const email = decoded.preferred_username || decoded.email;

			if (!azureId || !email) {
				set.status = 401;
				throw new Error("Unauthorized: Invalid token claims");
			}

			// Find or create admin user
			let user = await User.findOne({ azureId }).select("-password");

			if (!user) {
				// Create new admin user from Entra ID
				user = await User.create({
					email: email as string,
					azureId,
					role: UserRole.ADMIN,
					authProvider: AuthProvider.ENTRA_ID,
				});
				console.log(`✅ Created new admin user: ${email}`);
			}

			return { user: user as IUser, azurePayload: decoded };
		} catch (error) {
			set.status = 401;
			throw new Error(
				`Unauthorized: ${error instanceof Error ? error.message : "Invalid Entra ID token"}`,
			);
		}
	},
);
