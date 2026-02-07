"use client";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  BarChart2,
  Trash2,
  ExternalLink,
  Search,
  MoreVertical,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import { API_ENDPOINTS, getShortUrl } from "@/lib/config";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { CreateUrlModal } from "@/components/urls/CreateUrlModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fetchUrls = async (token: string) => {
  const res = await fetch(API_ENDPOINTS.urls.list, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch URLs");
  return res.json();
};

const fetchAnalytics = async (token: string, shortCode: string) => {
  const res = await fetch(API_ENDPOINTS.urls.analytics(shortCode), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
};

const deleteUrl = async (token: string, shortCode: string) => {
  const res = await fetch(API_ENDPOINTS.urls.delete(shortCode), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete URL");
  return res.json();
};

export default function LinksPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["urls"],
    queryFn: () => fetchUrls(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (shortCode: string) => deleteUrl(token!, shortCode),
    onSuccess: () => {
      toast.success("URL deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete URL");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const openAnalytics = async (url: any) => {
    setSelectedUrl(url);
    setAnalyticsOpen(true);
    setLoadingAnalytics(true);
    try {
      const data = await fetchAnalytics(token!, url.shortCode);
      setAnalyticsData(data.data);
    } catch (_error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const urls = data?.data?.urls || [];
  const filteredUrls = urls.filter(
    (url: any) =>
      url.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      url.originalUrl.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Links</h1>
          <p className="text-muted-foreground text-lg">
            View and manage all your shortened URLs.
          </p>
        </div>
        <CreateUrlModal />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="bg-card border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredUrls.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredUrls.map((url: any) => (
                <div
                  key={url._id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* LIME NEON for shortCode */}
                      <h3 className="font-bold text-lg text-primary">
                        {url.shortCode}
                      </h3>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {formatDate(url.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {url.originalUrl}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <BarChart2 className="h-3 w-3" />{" "}
                        {formatNumber(url.clickCount || 0)} clicks
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Copy Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                      onClick={() =>
                        copyToClipboard(getShortUrl(url.shortCode))
                      }
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {/* Open in new tab - RIGHT BESIDE COPY */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                      onClick={() =>
                        window.open(getShortUrl(url.shortCode), "_blank")
                      }
                      title="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {/* More options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAnalytics(url)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteMutation.mutate(url.shortCode)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <ExternalLink className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No links found</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                {search
                  ? "Try a different search term."
                  : "Create your first shortened URL to get started."}
              </p>
              {!search && (
                <CreateUrlModal trigger={<Button>Create Link</Button>} />
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Analytics Modal */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BarChart2 className="h-6 w-6 text-primary" />
              Analytics for{" "}
              <span className="text-primary font-mono">
                {selectedUrl?.shortCode}
              </span>
            </DialogTitle>
          </DialogHeader>

          {loadingAnalytics ? (
            <div className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          ) : analyticsData ? (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 border-primary/20 bg-primary/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Clicks
                    </p>
                    <BarChart2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {formatNumber(analyticsData.url?.clickCount || 0)}
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Original URL
                    </p>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div
                    className="text-sm font-medium break-all line-clamp-2"
                    title={analyticsData.url?.originalUrl}
                  >
                    {analyticsData.url?.originalUrl}
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Created At
                    </p>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-xl font-semibold">
                    {formatDate(analyticsData.url?.createdAt)}
                  </div>
                </Card>
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Countries */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-primary">
                    <Globe className="h-4 w-4" /> Top Locations
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {analyticsData.analytics?.clicksByCountry?.length > 0 ? (
                      analyticsData.analytics.clicksByCountry.map(
                        (item: any) => (
                          <div
                            key={item._id}
                            className="flex justify-between items-center p-2 rounded hover:bg-muted transition-colors text-sm"
                          >
                            <span className="font-medium">
                              {item._id || "Unknown"}
                            </span>
                            <span className="text-muted-foreground">
                              {item.count}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No location data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Devices */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-primary">
                    <Monitor className="h-4 w-4" /> Devices
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {analyticsData.analytics?.clicksByDevice?.length > 0 ? (
                      analyticsData.analytics.clicksByDevice.map(
                        (item: any) => (
                          <div
                            key={item._id}
                            className="flex justify-between items-center p-2 rounded hover:bg-muted transition-colors text-sm"
                          >
                            <span className="capitalize font-medium">
                              {item._id || "Unknown"}
                            </span>
                            <span className="text-muted-foreground">
                              {item.count}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No device data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Browsers */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-primary">
                    <Smartphone className="h-4 w-4" /> Browsers
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {analyticsData.analytics?.clicksByBrowser?.length > 0 ? (
                      analyticsData.analytics.clicksByBrowser.map(
                        (item: any) => (
                          <div
                            key={item._id}
                            className="flex justify-between items-center p-2 rounded hover:bg-muted transition-colors text-sm"
                          >
                            <span className="capitalize font-medium">
                              {item._id || "Unknown"}
                            </span>
                            <span className="text-muted-foreground">
                              {item.count}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No browser data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <BarChart2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No analytics data</h3>
              <p className="text-muted-foreground mt-2">
                This URL hasn&apos;t received any clicks yet.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
