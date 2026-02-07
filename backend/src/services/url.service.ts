import type { Types } from "mongoose";
import config from "../config";
import { type IClick, type IUrl, Url } from "../models";
import { RedisService } from "./redis.service";
import {
	generateShortCode,
	isReservedSlug,
	isSlugAvailable,
	isValidCustomSlug,
} from "./shortcode.service";

interface CreateUrlInput {
	originalUrl: string;
	customSlug?: string;
	userId: Types.ObjectId;
	expiryDays?: number;
}

interface ClickData {
	ip?: string;
	userAgent?: string;
	referer?: string;
}

/**
 * Validate that a URL uses a safe protocol (http or https only)
 * Prevents open redirect and XSS attacks via javascript:, data:, vbscript:, etc.
 */
const isValidUrlProtocol = (url: string): boolean => {
	const urlLower = url.toLowerCase().trim();
	return urlLower.startsWith("http://") || urlLower.startsWith("https://");
};

export class UrlService {
	/**
	 * Create a new shortened URL
	 */
	static async create(input: CreateUrlInput): Promise<IUrl> {
		const { originalUrl, customSlug, userId, expiryDays } = input;

		// Validate URL protocol to prevent XSS and open redirect attacks
		if (!isValidUrlProtocol(originalUrl)) {
			throw new Error(
				"Invalid URL: Only http:// and https:// protocols are allowed",
			);
		}

		// Validate custom slug if provided
		if (customSlug) {
			if (isReservedSlug(customSlug)) {
				throw new Error("This slug is reserved and cannot be used");
			}

			if (!isValidCustomSlug(customSlug)) {
				throw new Error(
					"Invalid custom slug format. Use 3-50 alphanumeric characters and hyphens.",
				);
			}

			const available = await isSlugAvailable(customSlug);
			if (!available) {
				throw new Error("Custom slug is already in use");
			}
		}

		const shortCode = customSlug || (await generateShortCode());

		// Calculate expiration date
		const expiresAt = new Date(
			Date.now() + (expiryDays || config.urlExpiryDays) * 24 * 60 * 60 * 1000,
		);

		const url = await Url.create({
			shortCode,
			originalUrl,
			customSlug: customSlug || undefined,
			userId,
			expiresAt,
		});

		// Cache the URL in Redis for fast redirects
		if (config.redisEnabled) {
			const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
			await RedisService.cacheUrl(shortCode, originalUrl, ttlSeconds);
		}

		return url;
	}

	/**
	 * Get URL by short code (only if active and not expired)
	 */
	static async getByShortCode(shortCode: string): Promise<IUrl | null> {
		return Url.findOne({
			shortCode,
			isActive: true,
			$or: [
				{ expiresAt: { $exists: false } },
				{ expiresAt: { $gt: new Date() } },
			],
		});
	}

	/**
	 * Get paginated list of user's URLs
	 */
	static async getUserUrls(userId: Types.ObjectId, page = 1, limit = 10) {
		const skip = (page - 1) * limit;

		const [urls, total] = await Promise.all([
			Url.find({ userId })
				.select("-clicks") // Exclude clicks array for list view (too heavy)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Url.countDocuments({ userId }),
		]);

		return {
			urls,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	/**
	 * Record a click and return original URL for redirect
	 * Uses Redis cache for fast lookups, falls back to MongoDB
	 */
	static async recordClick(
		shortCode: string,
		clickData: ClickData,
	): Promise<string | null> {
		let originalUrl: string | null = null;

		// Try Redis cache first (sub-millisecond lookup)
		if (config.redisEnabled) {
			originalUrl = await RedisService.getCachedUrl(shortCode);
		}

		// Cache hit - buffer click data and return immediately
		if (originalUrl) {
			// Buffer click in Redis for batch processing (non-blocking)
			if (config.redisEnabled) {
				RedisService.bufferClick(shortCode, {
					ip: clickData.ip,
					userAgent: clickData.userAgent,
					referer: clickData.referer,
					timestamp: Date.now(),
				}).catch(() => {}); // Fire and forget
			}

			// Also record in MongoDB (can be made async/batched later)
			UrlService.recordClickToDb(shortCode, clickData).catch(() => {});

			return originalUrl;
		}

		// Cache miss - fetch from MongoDB
		const url = await UrlService.getByShortCode(shortCode);
		if (!url) return null;

		// Cache the URL for future requests
		if (config.redisEnabled) {
			const ttlSeconds = url.expiresAt
				? Math.floor((url.expiresAt.getTime() - Date.now()) / 1000)
				: 3600; // Default 1 hour if no expiry
			await RedisService.cacheUrl(
				shortCode,
				url.originalUrl,
				Math.max(ttlSeconds, 60),
			);
		}

		// Record click to database
		await UrlService.recordClickToDb(shortCode, clickData, url);

		return url.originalUrl;
	}

	/**
	 * Record click data to MongoDB
	 */
	private static async recordClickToDb(
		shortCode: string,
		clickData: ClickData,
		url?: IUrl | null,
	): Promise<void> {
		if (!url) {
			url = await UrlService.getByShortCode(shortCode);
		}
		if (!url) return;

		// Parse user agent for device/browser info
		const click: IClick = {
			timestamp: new Date(),
			ip: clickData.ip,
			userAgent: clickData.userAgent,
			referer: clickData.referer,
			device: UrlService.parseDevice(clickData.userAgent),
			browser: UrlService.parseBrowser(clickData.userAgent),
			os: UrlService.parseOS(clickData.userAgent),
			// Note: In production, use a geo-IP service (e.g., MaxMind) for country/city
			country: undefined,
			city: undefined,
		};

		// Update click count and add click record
		await Url.updateOne(
			{ _id: url._id },
			{
				$push: { clicks: click },
				$inc: { clickCount: 1 },
			},
		);
	}

	/**
	 * Delete a URL (only if owned by user)
	 */
	static async delete(
		shortCode: string,
		userId: Types.ObjectId,
	): Promise<boolean> {
		const result = await Url.deleteOne({ shortCode, userId });

		// Invalidate Redis cache
		if (result.deletedCount > 0 && config.redisEnabled) {
			await RedisService.invalidateUrlCache(shortCode);
		}

		return result.deletedCount > 0;
	}

	/**
	 * Get analytics for a specific URL
	 */
	static async getAnalytics(shortCode: string, userId: Types.ObjectId) {
		const url = await Url.findOne({ shortCode, userId });
		if (!url) return null;

		// Aggregate click analytics
		const [clicksByDay, clicksByCountry, clicksByDevice, clicksByBrowser] =
			await Promise.all([
				// Clicks by day (last 30 days)
				Url.aggregate([
					{ $match: { _id: url._id } },
					{ $unwind: "$clicks" },
					{
						$group: {
							_id: {
								$dateToString: {
									format: "%Y-%m-%d",
									date: "$clicks.timestamp",
								},
							},
							count: { $sum: 1 },
						},
					},
					{ $sort: { _id: 1 } },
					{ $limit: 30 },
				]),

				// Clicks by country
				Url.aggregate([
					{ $match: { _id: url._id } },
					{ $unwind: "$clicks" },
					{
						$group: {
							_id: { $ifNull: ["$clicks.country", "Unknown"] },
							count: { $sum: 1 },
						},
					},
					{ $sort: { count: -1 } },
					{ $limit: 10 },
				]),

				// Clicks by device
				Url.aggregate([
					{ $match: { _id: url._id } },
					{ $unwind: "$clicks" },
					{
						$group: {
							_id: { $ifNull: ["$clicks.device", "unknown"] },
							count: { $sum: 1 },
						},
					},
				]),

				// Clicks by browser
				Url.aggregate([
					{ $match: { _id: url._id } },
					{ $unwind: "$clicks" },
					{
						$group: {
							_id: { $ifNull: ["$clicks.browser", "unknown"] },
							count: { $sum: 1 },
						},
					},
				]),
			]);

		return {
			url: {
				shortCode: url.shortCode,
				originalUrl: url.originalUrl,
				clickCount: url.clickCount,
				createdAt: url.createdAt,
				expiresAt: url.expiresAt,
				isActive: url.isActive,
			},
			analytics: {
				clicksByDay,
				clicksByCountry,
				clicksByDevice,
				clicksByBrowser,
			},
		};
	}

	/**
	 * Parse device type from user agent (simplified)
	 * In production, consider using ua-parser-js
	 */
	private static parseDevice(ua?: string): string {
		if (!ua) return "unknown";
		const lowerUa = ua.toLowerCase();
		if (/mobile|android|iphone|ipad|phone/i.test(lowerUa)) {
			if (/tablet|ipad/i.test(lowerUa)) return "tablet";
			return "mobile";
		}
		return "desktop";
	}

	/**
	 * Parse browser from user agent (simplified)
	 */
	private static parseBrowser(ua?: string): string {
		if (!ua) return "unknown";
		if (/edg/i.test(ua)) return "Edge";
		if (/chrome/i.test(ua)) return "Chrome";
		if (/firefox/i.test(ua)) return "Firefox";
		if (/safari/i.test(ua)) return "Safari";
		if (/opera|opr/i.test(ua)) return "Opera";
		return "other";
	}

	/**
	 * Parse OS from user agent (simplified)
	 */
	private static parseOS(ua?: string): string {
		if (!ua) return "unknown";
		if (/windows/i.test(ua)) return "Windows";
		if (/macintosh|mac os/i.test(ua)) return "MacOS";
		if (/linux/i.test(ua)) return "Linux";
		if (/android/i.test(ua)) return "Android";
		if (/iphone|ipad|ios/i.test(ua)) return "iOS";
		return "other";
	}
}
