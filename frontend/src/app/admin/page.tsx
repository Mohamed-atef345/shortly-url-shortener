"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Link as LinkIcon,
  MousePointerClick,
  Activity,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";

export default function AdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes] = await Promise.all([
        fetch(API_ENDPOINTS.admin.stats, { headers }),
        fetch(API_ENDPOINTS.admin.users, { headers }),
      ]);

      if (!statsRes.ok || !usersRes.ok) throw new Error("Failed to fetch data");

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData.data);
      setUsers(usersData.data);
    } catch (error) {
      toast.error("Failed to load admin data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "admin") {
      toast.error("Unauthorized access");
      router.push("/dashboard");
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, token]);

  const handleToggleSuspension = async (userId: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.admin.suspendUser(userId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to toggle suspension");
      }

      const data = await res.json();
      toast.success(data.message);
      fetchData(); // Refresh data
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(API_ENDPOINTS.admin.deleteUser(userToDelete), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      const data = await res.json();
      toast.success(data.message);
      fetchData(); // Refresh data
    } catch (_error) {
      toast.error("Delete failed");
    } finally {
      setUserToDelete(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System-wide statistics and management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.urls || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clicks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "outline"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.isSuspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {u._id !== user.id && (
                      <>
                        <Button
                          variant={u.isSuspended ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleToggleSuspension(u._id)}
                          title={u.isSuspended ? "Unsuspend" : "Suspend"}
                        >
                          {u.isSuspended ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4 text-amber-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(u._id)}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove all associated URLs from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
