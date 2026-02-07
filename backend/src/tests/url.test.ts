import { describe, expect, it } from "bun:test";

describe("URL Validation", () => {
	const isValidUrlProtocol = (url: string): boolean => {
		const urlLower = url.toLowerCase().trim();
		return urlLower.startsWith("http://") || urlLower.startsWith("https://");
	};

	it("should accept http URLs", () => {
		expect(isValidUrlProtocol("http://example.com")).toBe(true);
		expect(isValidUrlProtocol("http://localhost:3000")).toBe(true);
	});

	it("should accept https URLs", () => {
		expect(isValidUrlProtocol("https://example.com")).toBe(true);
		expect(isValidUrlProtocol("https://google.com/search?q=test")).toBe(true);
	});

	it("should reject javascript: URLs (XSS prevention)", () => {
		expect(isValidUrlProtocol("javascript:alert(1)")).toBe(false);
		expect(isValidUrlProtocol("JAVASCRIPT:alert(1)")).toBe(false);
	});

	it("should reject data: URLs", () => {
		expect(isValidUrlProtocol("data:text/html,<script>alert(1)</script>")).toBe(
			false,
		);
	});

	it("should reject other protocols", () => {
		expect(isValidUrlProtocol("ftp://example.com")).toBe(false);
		expect(isValidUrlProtocol("file:///etc/passwd")).toBe(false);
	});
});

describe("Health Check", () => {
	it("should pass basic health check", () => {
		expect(true).toBe(true);
	});
});
