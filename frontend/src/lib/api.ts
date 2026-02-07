import { treaty } from "@elysiajs/eden";
import { API_URL } from "./config";

// Create client without backend type dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api = treaty<any>(API_URL);

// Helper for auth headers
export const getAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
