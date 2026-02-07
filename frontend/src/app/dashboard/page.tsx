"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
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

export default function DashboardPage() {
  const { token, user } = useAuth();
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

  const totalClicks = urls.reduce(
    (sum: number, url: any) => sum + (url.clickCount || 0),
    0,
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back,{" "}
            <span className="text-primary">{user?.name || "User"}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your links and view analytics.
          </p>
        </div>
        <CreateUrlModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Clicks
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatNumber(totalClicks)}
            </div>
            <p className="text-xs text-muted-foreground">Across all links</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Active Links
            </CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{urls.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total shortened URLs
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Most Popular
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">
              {urls.length > 0
                ? urls.reduce((max: any, url: any) =>
                    (url.clickCount || 0) > (max.clickCount || 0) ? url : max,
                  ).shortCode
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {urls.length > 0
                ? `${formatNumber(
                    urls.reduce((max: any, url: any) =>
                      (url.clickCount || 0) > (max.clickCount || 0) ? url : max,
                    ).clickCount || 0,
                  )} clicks`
                : "Create your first link"}
            </p>
          </CardContent>
        </Card>
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
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(getShortUrl(url.shortCode), "_blank")
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Link
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
              <h3 className="text-lg font-medium">No links created yet</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Create your first shortened URL to get started.
              </p>
              <CreateUrlModal trigger={<Button>Create Link</Button>} />
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

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
