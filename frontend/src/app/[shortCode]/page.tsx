import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { INTERNAL_API_ENDPOINTS } from "@/lib/config";
import Link from "next/link";

interface PageProps {
  params: Promise<{ shortCode: string }>;
}

export default async function ShortUrlRedirect({ params }: PageProps) {
  const { shortCode } = await params;

  try {
    // Call the backend to get the redirect info (without 302 loop)
    // Uses INTERNAL_API_URL for Kubernetes service-to-service communication
    const response = await fetch(
      INTERNAL_API_ENDPOINTS.urls.redirectInfo(shortCode),
      {
        cache: "no-store", // Don't cache this request
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.originalUrl) {
        // Perform the final redirect to the destination
        redirect(data.originalUrl);
      }
    }
  } catch (error) {
    // Re-throw redirect errors - Next.js uses errors internally for redirects
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Redirect error:", error);
  }

  // If redirect failed or link not found, show 404
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Link not found or expired</p>
      <Link
        href="/"
        className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
