import { customAlphabet } from "nanoid";
import { Url } from "../models";

// Base62 alphabet for URL-safe short codes
const alphabet =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 7);

/**
 * Generate a unique short code for URLs
 * Attempts up to 10 times to find a unique code
 */
export const generateShortCode = async (): Promise<string> => {
	let shortCode: string;
	let attempts = 0;
	const maxAttempts = 10;

	do {
		shortCode = nanoid();
		const existing = await Url.findOne({ shortCode });
		if (!existing) return shortCode;
		attempts++;
	} while (attempts < maxAttempts);

	throw new Error(
		"Failed to generate unique short code after maximum attempts",
	);
};

/**
 * Validate custom slug format
 * Rules: 3-50 chars, alphanumeric + hyphens, no consecutive hyphens
 */
export const isValidCustomSlug = (slug: string): boolean => {
	if (slug.length < 3 || slug.length > 50) return false;

	// Alphanumeric with hyphens, must start and end with alphanumeric
	const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

	// No consecutive hyphens
	if (slug.includes("--")) return false;

	return regex.test(slug);
};

/**
 * Check if a slug/shortCode is available for use
 */
export const isSlugAvailable = async (slug: string): Promise<boolean> => {
	const existing = await Url.findOne({
		$or: [{ shortCode: slug }, { customSlug: slug }],
	});
	return !existing;
};

/**
 * Reserved slugs that cannot be used as custom slugs
 */
export const reservedSlugs = [
	"api",
	"admin",
	"dashboard",
	"login",
	"register",
	"logout",
	"health",
	"swagger",
	"docs",
	"static",
	"assets",
];

export const isReservedSlug = (slug: string): boolean => {
	return reservedSlugs.includes(slug.toLowerCase());
};
