import { describe, expect, it } from "bun:test";
import {
	isReservedSlug,
	isValidCustomSlug,
	reservedSlugs,
} from "../services/shortcode.service";

describe("Shortcode Service", () => {
	describe("isValidCustomSlug", () => {
		it("should accept valid slugs", () => {
			expect(isValidCustomSlug("my-link")).toBe(true);
			expect(isValidCustomSlug("abc123")).toBe(true);
			expect(isValidCustomSlug("a1b")).toBe(true);
		});

		it("should reject slugs that are too short", () => {
			expect(isValidCustomSlug("ab")).toBe(false);
			expect(isValidCustomSlug("a")).toBe(false);
		});

		it("should reject slugs with consecutive hyphens", () => {
			expect(isValidCustomSlug("my--link")).toBe(false);
		});

		it("should reject slugs starting or ending with hyphen", () => {
			expect(isValidCustomSlug("-mylink")).toBe(false);
			expect(isValidCustomSlug("mylink-")).toBe(false);
		});
	});

	describe("isReservedSlug", () => {
		it("should detect reserved slugs", () => {
			expect(isReservedSlug("api")).toBe(true);
			expect(isReservedSlug("admin")).toBe(true);
			expect(isReservedSlug("dashboard")).toBe(true);
		});

		it("should be case-insensitive", () => {
			expect(isReservedSlug("API")).toBe(true);
			expect(isReservedSlug("Admin")).toBe(true);
		});

		it("should allow non-reserved slugs", () => {
			expect(isReservedSlug("my-custom-link")).toBe(false);
			expect(isReservedSlug("example123")).toBe(false);
		});
	});

	describe("reservedSlugs list", () => {
		it("should contain essential reserved paths", () => {
			expect(reservedSlugs).toContain("api");
			expect(reservedSlugs).toContain("admin");
			expect(reservedSlugs).toContain("health");
		});
	});
});
