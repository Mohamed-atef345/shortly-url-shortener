/**
 * Centralized Configuration for Shortly Frontend
 *
 * This file provides a single source of truth for all URL configurations.
 * All API calls should use these constants to ensure consistency.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: Base URL for API calls (client-side)
 * - NEXT_PUBLIC_BASE_URL: Base URL for short links (displayed to users)
 * - INTERNAL_API_URL: Internal URL for server-to-server communication (Kubernetes)
 */

// =============================================================================
// URL Configuration
// =============================================================================

/**
 * API URL for client-side requests (browser → backend)
 *
 * In Kubernetes with Ingress:
 * - Set to the ingress URL without /api suffix (e.g., "http://localhost")
 * - The /api prefix is added by individual endpoints
 *
 * In local development:
 * - Set to "http://localhost:3002" (direct backend access)
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

/**
 * Base URL for short links (displayed to users for copying)
 *
 * This is the public-facing URL where short links are accessible.
 * Example: If BASE_URL is "https://short.ly", a link would be "https://short.ly/abc123"
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3002";

/**
 * Internal API URL for server-side requests (Next.js server → backend)
 *
 * In Kubernetes:
 * - Use the internal service URL (e.g., "http://shortly-backend-service:80")
 *
 * Falls back to API_URL if not set (works for local development)
 */
export const INTERNAL_API_URL = process.env.INTERNAL_API_URL || API_URL;

// =============================================================================
// API Endpoints
// =============================================================================

/**
 * All API endpoints used by the frontend.
 * Using a centralized object prevents typos and makes refactoring easier.
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${API_URL}/api/auth/login`,
    register: `${API_URL}/api/auth/register`,
    me: `${API_URL}/api/auth/me`,
    deleteAccount: `${API_URL}/api/auth/delete-account`,
  },

  // URL Management
  urls: {
    list: `${API_URL}/api/urls`,
    create: `${API_URL}/api/urls`,
    get: (shortCode: string) => `${API_URL}/api/urls/${shortCode}`,
    delete: (shortCode: string) => `${API_URL}/api/urls/${shortCode}`,
    analytics: (shortCode: string) =>
      `${API_URL}/api/urls/${shortCode}/analytics`,
    redirectInfo: (shortCode: string) =>
      `${API_URL}/api/urls/${shortCode}/redirect-info`,
  },

  // Admin
  admin: {
    stats: `${API_URL}/api/admin/stats`,
    users: `${API_URL}/api/admin/users`,
    suspendUser: (id: string) => `${API_URL}/api/admin/users/${id}/suspend`,
    deleteUser: (id: string) => `${API_URL}/api/admin/users/${id}`,
  },
} as const;

/**
 * Internal API endpoints for server-side requests (e.g., in Server Components)
 * These use INTERNAL_API_URL for Kubernetes service-to-service communication
 */
export const INTERNAL_API_ENDPOINTS = {
  urls: {
    redirectInfo: (shortCode: string) =>
      `${INTERNAL_API_URL}/api/urls/${shortCode}/redirect-info`,
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a full short URL for display/copying
 * @param shortCode - The short code of the URL
 * @returns Full short URL (e.g., "https://short.ly/abc123")
 */
export const getShortUrl = (shortCode: string): string => {
  return `${BASE_URL}/${shortCode}`;
};

/**
 * Check if we're running in a browser environment
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Check if we're in development mode
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Check if we're in production mode
 */
export const isProduction = process.env.NODE_ENV === "production";
