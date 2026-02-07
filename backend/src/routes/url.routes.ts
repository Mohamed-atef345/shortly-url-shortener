import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import config from "../config";
import { type IUser, User } from "../models";
import { UrlService } from "../services";

/**
 * Helper function to verify auth and get user
 */
async function verifyAuth(
	authHeader: string | undefined,
	jwtVerify: (token: string) => Promise<any>,
): Promise<{ user: IUser | null; error: string | null }> {
	if (!authHeader?.startsWith("Bearer ")) {
		return { user: null, error: "Unauthorized: No token provided" };
	}

	const token = authHeader.substring(7);
	const payload = await jwtVerify(token);

	if (!payload) {
		return { user: null, error: "Unauthorized: Invalid token" };
	}

	const user = await User.findById(payload.sub).select("-password");
	if (!user) {
		return { user: null, error: "Unauthorized: User not found" };
	}

	return { user: user as IUser, error: null };
}

/**
 * URL Management Routes (Protected)
 * Handles CRUD operations for shortened URLs
 */
export const urlRoutes = new Elysia({ prefix: "/api/urls" })
	.use(
		jwt({
			name: "jwt",
			secret: config.jwtSecret,
		}),
	)

	// POST /api/urls - Create short URL
	.post(
		"/",
		async ({ body, headers, jwt, set }) => {
			const { user, error } = await verifyAuth(
				headers.authorization,
				jwt.verify,
			);

			if (error || !user) {
				set.status = 401;
				return { success: false, error: error || "Unauthorized" };
			}

			try {
				const url = await UrlService.create({
					originalUrl: body.url,
					customSlug: body.customSlug,
					userId: user._id,
					expiryDays: body.expiryDays,
				});

				return {
					success: true,
					data: {
						shortCode: url.shortCode,
						shortUrl: `${config.baseUrl}/${url.shortCode}`,
						originalUrl: url.originalUrl,
						expiresAt: url.expiresAt,
						createdAt: url.createdAt,
					},
				};
			} catch (err: any) {
				set.status = 400;
				return {
					success: false,
					error: err.message || "Failed to create URL",
				};
			}
		},
		{
			body: t.Object({
				url: t.String({ format: "uri" }),
				customSlug: t.Optional(t.String({ minLength: 3, maxLength: 50 })),
				expiryDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
			}),
			detail: {
				tags: ["URLs"],
				summary: "Create short URL",
				description: "Creates a new shortened URL with optional custom slug",
			},
		},
	)

	// GET /api/urls - Get user's URLs (paginated)
	.get(
		"/",
		async ({ query, headers, jwt, set }) => {
			const { user, error } = await verifyAuth(
				headers.authorization,
				jwt.verify,
			);

			if (error || !user) {
				set.status = 401;
				return { success: false, error: error || "Unauthorized" };
			}

			const page = query.page || 1;
			const limit = Math.min(query.limit || 10, 100);

			const result = await UrlService.getUserUrls(user._id, page, limit);

			return {
				success: true,
				data: {
					urls: result.urls.map((url: any) => ({
						_id: url._id,
						shortCode: url.shortCode,
						shortUrl: `${config.baseUrl}/${url.shortCode}`,
						originalUrl: url.originalUrl,
						clickCount: url.clickCount,
						isActive: url.isActive,
						createdAt: url.createdAt,
						expiresAt: url.expiresAt,
					})),
					pagination: result.pagination,
				},
			};
		},
		{
			query: t.Object({
				page: t.Optional(t.Numeric({ minimum: 1 })),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
			}),
			detail: {
				tags: ["URLs"],
				summary: "List user's URLs",
				description: "Returns paginated list of user's shortened URLs",
			},
		},
	)

	// GET /api/urls/:shortCode/analytics - Get URL analytics
	.get(
		"/:shortCode/analytics",
		async ({ params, headers, jwt, set }) => {
			const { user, error } = await verifyAuth(
				headers.authorization,
				jwt.verify,
			);

			if (error || !user) {
				set.status = 401;
				return { success: false, error: error || "Unauthorized" };
			}

			const analytics = await UrlService.getAnalytics(
				params.shortCode,
				user._id,
			);

			if (!analytics) {
				set.status = 404;
				return { success: false, error: "URL not found" };
			}

			return { success: true, data: analytics };
		},
		{
			params: t.Object({
				shortCode: t.String(),
			}),
			detail: {
				tags: ["URLs"],
				summary: "Get URL analytics",
				description: "Returns detailed analytics for a specific URL",
			},
		},
	)

	// DELETE /api/urls/:shortCode - Delete URL
	.delete(
		"/:shortCode",
		async ({ params, headers, jwt, set }) => {
			const { user, error } = await verifyAuth(
				headers.authorization,
				jwt.verify,
			);

			if (error || !user) {
				set.status = 401;
				return { success: false, error: error || "Unauthorized" };
			}

			const deleted = await UrlService.delete(params.shortCode, user._id);

			if (!deleted) {
				set.status = 404;
				return { success: false, error: "URL not found" };
			}

			return { success: true, message: "URL deleted successfully" };
		},
		{
			params: t.Object({
				shortCode: t.String(),
			}),
			detail: {
				tags: ["URLs"],
				summary: "Delete URL",
				description: "Deletes a shortened URL owned by the user",
			},
		},
	);
