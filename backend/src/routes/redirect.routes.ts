import { Elysia } from "elysia";
import { UrlService } from "../services";

// Reserved paths that should not be treated as short codes
const RESERVED_PATHS = ["api", "swagger", "health"];

/**
 * Check if a path is reserved (should not be treated as a short code)
 */
const isReservedPath = (path: string): boolean => {
	return RESERVED_PATHS.some(
		(reserved) =>
			path === reserved ||
			path.startsWith(`${reserved}/`) ||
			path.startsWith(`${reserved}?`),
	);
};

/**
 * Redirect Routes
 * Handles short URL redirects and click tracking
 */
export const redirectRoutes = new Elysia()
	// GET /:shortCode - Redirect to original URL
	.get(
		"/:shortCode",
		async ({ params, set, headers, redirect }) => {
			const { shortCode } = params;

			// Skip reserved routes
			if (isReservedPath(shortCode)) {
				set.status = 404;
				return;
			}

			// Record click and get original URL
			const originalUrl = await UrlService.recordClick(shortCode, {
				ip:
					headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
					headers["x-real-ip"],
				userAgent: headers["user-agent"],
				referer: headers.referer,
			});

			if (!originalUrl) {
				set.status = 404;
				return `
          <!DOCTYPE html>
          <html>
            <head><title>Not Found</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1>404 - Link Not Found</h1>
              <p>This short URL does not exist or has expired.</p>
              <a href="/">Go Home</a>
            </body>
          </html>
        `;
			}

			// Validate URL protocol
			const urlLower = originalUrl.toLowerCase().trim();
			if (!urlLower.startsWith("http://") && !urlLower.startsWith("https://")) {
				set.status = 400;
				return "Invalid destination URL protocol";
			}

			return redirect(originalUrl, 302);
		},
		{
			detail: {
				tags: ["Redirect"],
				summary: "Redirect short URL",
				description: "Redirects to the original URL and tracks the click",
			},
		},
	)

	// GET /api/urls/:shortCode/redirect-info - Get Redirect Info (JSON)
	// Used by Frontend for handling redirections without 302 loop
	.get(
		"/api/urls/:shortCode/redirect-info",
		async ({ params, set, headers }) => {
			const { shortCode } = params;

			if (isReservedPath(shortCode)) {
				set.status = 404;
				return { success: false, error: "Invalid short code" };
			}

			const originalUrl = await UrlService.recordClick(shortCode, {
				ip:
					headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
					headers["x-real-ip"],
				userAgent: headers["user-agent"],
				referer: headers.referer,
			});

			if (!originalUrl) {
				set.status = 404;
				return { success: false, error: "Link not found or expired" };
			}

			return { success: true, originalUrl };
		},
		{
			detail: {
				tags: ["Redirect"],
				summary: "Get Redirect Info",
				description: "Returns the original URL for client-side redirection",
			},
		},
	);
